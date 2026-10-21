const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../lausd_magnet_app/web/application-guide.js'),'utf8'),context);
for(const [date,key] of [['2026-09-30','guideUpcoming'],['2026-10-01','guideOpen'],['2026-11-06','guideOpen'],['2026-11-07','guideClosed'],['2026-12-01','guideLate'],['2027-01-01','guideVerify']]) {
  test('application date boundary '+date,()=>assert.equal(context.applicationStatusKey(date),key));
}
