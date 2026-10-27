import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAssignment, parseHeartbeat, eligibleForWork, toOfficeTask } from '../../src/lib/office/workflow.ts';

const id='11111111-1111-4111-8111-111111111111';
const actor={id,lembagaId:'a',unitId:'u2',peran:'amil',nama:'Saksi'};
const item={id:'w',lembagaId:'a',referenceType:'penyaluran',referenceId:'p',code:'ZK1234567890',stage:'saksi',status:'open',version:1,assignedRole:'amil',assignedUserId:null,creatorId:'maker',creatorUnitId:'u1',witnessIds:[],witnessUnitIds:[],domainStatus:'menunggu_konfirmasi',method:'saksi',destination:'Desa A',amount:'50000',eligibleUserIds:[id]};
test('assignment accepts only UUIDs, bounded reason, actions and positive integer version',()=>{
  assert.deepEqual(parseAssignment({itemId:id,version:1,requestId:id,action:'claim'}),{itemId:id,version:1,requestId:id,action:'claim',targetUserId:null,reason:''});
  for(const patch of [{version:0},{version:1.5},{version:'1'},{itemId:'demo'},{action:'approve'},{requestId:'x'},{action:'handoff'},{reason:'x'.repeat(501)},{action:'release',targetUserId:id}])assert.equal(parseAssignment({itemId:id,version:1,requestId:id,action:'claim',...patch}),null);
});
test('heartbeat rejects invented stations and non UUID sessions',()=>{
  assert.deepEqual(parseHeartbeat({sessionId:id,station:'saksi'}),{sessionId:id,station:'saksi'});
  for(const input of [{sessionId:'x',station:null},{sessionId:id,station:'bank'},{sessionId:id,station:42}])assert.equal(parseHeartbeat(input),null);
});
test('witness policy enforces tenant, role, creator and every previous witness unit',()=>{
  assert.equal(eligibleForWork(item,actor),true);
  for(const patch of [{lembagaId:'b'},{unitId:'u1'},{id:'maker'},{peran:'admin'}])assert.equal(eligibleForWork(item,{...actor,...patch}),false);
  assert.equal(eligibleForWork({...item,witnessIds:[id]},actor),false);
  assert.equal(eligibleForWork({...item,witnessUnitIds:['u2']},actor),false);
  assert.equal(eligibleForWork({...item,witnessIds:['s1','s2']},actor),false);
});
test('approval uses existing independent-unit policy and terminal work is ineligible',()=>{
  assert.equal(eligibleForWork({...item,stage:'persetujuan',assignedRole:'penyetuju'},{...actor,peran:'penyetuju'}),true);
  assert.equal(eligibleForWork({...item,status:'completed'},actor),false);
  assert.equal(eligibleForWork({...item,status:'cancelled'},actor),false);
  assert.equal(eligibleForWork({...item,stage:'penyaluran'},actor),false);
});
test('server projection preserves version/owner and never presents rejected records as delivered',()=>{
  const t=toOfficeTask({...item,status:'cancelled',domainStatus:'ditolak_penerima',stage:'catatan',assignedUserId:id});
  assert.equal(t.id,'w');assert.equal(t.terminal,true);assert.equal(t.done,false);assert.equal(t.amount,50000);assert.equal(t.path,'/penyaluran');
  assert.equal(toOfficeTask({...item,status:'completed',domainStatus:'tersalurkan'}).done,true);
});
