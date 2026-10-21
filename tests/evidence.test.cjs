const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function load() {
  const context=vm.createContext({URL, Intl, localStorage:{getItem(){return null;}}, document:{addEventListener(){}}});
  for(const file of ['schools_data.js','program_evidence.js','school-utils.js','i18n.js','app.js','quiz.js','application-guide.js','chat.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../lausd_magnet_app/web',file),'utf8'),context);
  }
  vm.runInContext('allSchools = SCHOOLS_DATA',context);
  return context;
}
test('every curated program joins a current campus and has dated bilingual official evidence',()=>{
  const context=load();
  const report=JSON.parse(vm.runInContext(`JSON.stringify(PROGRAM_EVIDENCE.map(record=>({
    name:record.schoolName, joined:SCHOOLS_DATA.some(school=>school.id===record.schoolId && school.name===record.schoolName),
    source:record.sourceUrl, date:record.checkedAt, translated:!!record.descriptionEs,
    eligibilityTranslated:!record.eligibilityNote || !!record.eligibilityNoteEs
  })))`,context));
  assert.ok(report.length>=10);
  for(const record of report) {
    assert.equal(record.joined,true,record.name);
    assert.equal(record.translated,true,record.name);
    assert.equal(record.eligibilityTranslated,true,record.name);
    const url=new URL(record.source);
    assert.ok(url.hostname.endsWith('.lausd.org') || (url.hostname==='sites.google.com' && url.pathname.startsWith('/lausd.net/')));
    assert.match(record.date,/^\d{4}-\d{2}-\d{2}$/);
  }
  assert.equal(vm.runInContext('SCHOOLS_DATA.some(s=>"quality" in s || "access" in s || "equity" in s)',context),false);
});
test('known off-campus program cannot produce misleading main-campus directions',()=>{
  const context=load();
  const html=vm.runInContext(`(()=>{const school=SCHOOLS_DATA.find(s=>s.name==='North Hollywood Senior High');return schoolLocationHtml(school)+schoolDetailsHtml(school,{compact:true});})()`,context);
  assert.ok(!html.includes('maps.google.com'));
  assert.match(html,/away from the main North Hollywood/);
  vm.runInContext("LANG='es'",context);
  const spanish=vm.runInContext(`schoolDetailsHtml(SCHOOLS_DATA.find(s=>s.name==='North Hollywood Senior High'),{compact:true})`,context);
  assert.match(spanish,/Zoo Magnet/);
  assert.ok(!spanish.includes('The Zoo Magnet meets away'));
});
test('source ID mismatch cannot attach a program through an obsolete matching name',()=>{
  const context=load();
  assert.equal(vm.runInContext(`SchoolUtils.programEvidence({id:'new',name:'Same name'},[{schoolId:'old',schoolName:'Same name',sourceUrl:'https://school.lausd.org',interests:['science']}]).length`,context),0);
  assert.equal(vm.runInContext(`SchoolUtils.servesGrade({low_grade:'TK',high_grade:'5'},'K')`,context),true);
});
test('hosted chat sends bounded history, language, and known comparison IDs',()=>{
  const context=load();
  vm.runInContext(`
    userSay=()=>{};
    requestChat=request=>request;
    compared=new Set([SCHOOLS_DATA[0].name,'unknown school']);
    chatHistory=Array.from({length:4},(_,i)=>[
      {role:'user',content:'Question '+i},{role:'assistant',content:'Answer '+i}
    ]).flat();
    LANG='es';
  `,context);
  const request=JSON.parse(vm.runInContext('JSON.stringify(handleMsg("medical programs"))',context));
  assert.equal(request.language,'es');
  assert.equal(request.messages.length,7);
  assert.equal(request.messages[0].role,'user');
  assert.deepEqual(request.messages.at(-1),{role:'user',content:'medical programs'});
  assert.deepEqual(request.comparisonSchoolIds,JSON.parse(vm.runInContext('JSON.stringify([SCHOOLS_DATA[0].id])',context)));
});
test('hosted add actions are additive and idempotent and reject unknown IDs at the comparison cap',()=>{
  const context=load();
  context.location={hash:''};
  context.localStorage={getItem(){return null;},setItem(){}};
  vm.runInContext('syncSchoolButtons=()=>{}; compared=new Set([SCHOOLS_DATA[0].name]);',context);
  const result=JSON.parse(vm.runInContext(`JSON.stringify(addSchoolIdsToComparison([
    ...SCHOOLS_DATA.slice(0,4).map(s=>s.id),'99999999999999','not-an-id'
  ]))`,context));
  assert.equal(result.added.length,2);
  assert.equal(result.existing.length,1);
  assert.deepEqual(result.rejected.map(item=>item.reason),['limit','not_found','invalid']);
  assert.equal(result.total,3);
  assert.equal(result.persisted,true);
  const repeat=JSON.parse(vm.runInContext('JSON.stringify(addSchoolIdsToComparison(SCHOOLS_DATA.slice(0,3).map(s=>s.id)))',context));
  assert.equal(repeat.added.length,0);
  assert.equal(repeat.existing.length,3);
  assert.equal(vm.runInContext('compared.has(SCHOOLS_DATA[0].name)',context),true);
});
test('long assistant replies cannot push follow-up history beyond the hosted request bounds',()=>{
  const context=load();
  vm.runInContext(`chatHistory=Array.from({length:4},()=>[
    {role:'user',content:'u'.repeat(1200)},{role:'assistant',content:'a'.repeat(4000)}
  ]).flat();`,context);
  const messages=JSON.parse(vm.runInContext('JSON.stringify(buildChatMessages("q".repeat(1200)))',context));
  assert.ok(messages.length<=8);
  assert.ok(messages.every(message=>message.content.length<=1200));
  assert.ok(messages.reduce((sum,message)=>sum+message.content.length,0)<=6000);
  assert.equal(messages[0].role,'user');
  assert.equal(messages.at(-1).role,'user');
  assert.equal(messages.at(-1).content,'q'.repeat(1200));
});
test('hosted chat source links and service errors retain explicit boundaries',()=>{
  const context=load();
  assert.equal(vm.runInContext('officialChatUrl("https://scienceacademy.lausd.org/program")',context),'https://scienceacademy.lausd.org/program');
  assert.equal(vm.runInContext('officialChatUrl("https://sites.google.com/lausd.net/orthoprojects/about")',context),'https://sites.google.com/lausd.net/orthoprojects/about');
  for(const url of ['javascript:alert(1)','https://lausd.org.evil.test/program','http://school.lausd.org/','https://sites.google.com/view/unreviewed']) {
    context.badUrl=url;
    assert.equal(vm.runInContext('officialChatUrl(badUrl)',context),null);
  }
  assert.equal(vm.runInContext('chatErrorKey(503,{error:{code:"NOT_CONFIGURED"}})',context),'chatNotConfigured');
  assert.equal(vm.runInContext('chatErrorKey(429,{error:{code:"RATE_LIMITED"}})',context),'chatLimit');
  assert.equal(vm.runInContext('chatErrorKey(504,{error:{code:"TIMEOUT"}})',context),'chatTimeout');
});

test('shared shortlist round-trips only known schools and enforces the three-school limit',async()=>{
  const context=load();
  context.location={href:'https://example.test/#results/9/science/match',hash:''};
  context.localStorage={getItem(){return null;},setItem(){}};
  vm.runInContext('copyLink=(url)=>url; compared=new Set(SCHOOLS_DATA.slice(0,3).map(s=>s.name));',context);
  const url=await vm.runInContext('shareShortlist()',context);
  assert.match(url,/#shortlist\//);
  assert.ok(!url.includes('stem_checklist'));
  context.location.hash=new URL(url).hash;
  vm.runInContext('compared=new Set(); switchTab=()=>{};',context);
  assert.equal(vm.runInContext('initShortlistFromURL()',context),true);
  assert.equal(vm.runInContext('compared.size',context),3);
  const expected=vm.runInContext('JSON.stringify(SCHOOLS_DATA.slice(0,3).map(s=>s.name))',context);
  assert.equal(vm.runInContext('JSON.stringify([...compared])',context),expected);
  context.location.hash='#shortlist/'+encodeURIComponent(JSON.stringify(['<script>bad</script>',...JSON.parse(expected),'unknown']));
  assert.equal(vm.runInContext('initShortlistFromURL()',context),true);
  assert.equal(vm.runInContext('compared.size',context),3);
  assert.equal(vm.runInContext('compared.has("<script>bad</script>")',context),false);
});
