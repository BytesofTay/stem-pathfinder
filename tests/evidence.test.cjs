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
test('help can find reviewed programs without assuming a grade or a school quality rating',()=>{
  const context=load();
  vm.runInContext('let replies=[]; botSay=(text)=>replies.push(text); handleMsg("medical programs");',context);
  const reply=vm.runInContext('replies.join(" ")',context);
  assert.match(reply,/Francisco Bravo/);
  assert.ok(!reply.includes('/10'));
  assert.match(reply,/not ranked by school quality/);
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
