import test from 'node:test';
import assert from 'node:assert/strict';
import { readOfficeJson, requireOfficeOrigin } from '../../src/lib/office/http.ts';
import { snapshotStream } from '../../src/lib/office/snapshot-stream.ts';
test('JSON reader enforces byte limit including chunked bodies and rejects malformed JSON',async()=>{
  assert.deepEqual(await readOfficeJson(new Request('http://local',{method:'POST',headers:{'content-type':'application/json'},body:'{"a":1}'})),{a:1});
  for(const [body,status] of [['{',400],['x'.repeat(8193),413]])await assert.rejects(()=>readOfficeJson(new Request('http://local',{method:'POST',headers:{'content-type':'application/json'},body})),e=>e.status===status);
  await assert.rejects(()=>readOfficeJson(new Request('http://local',{method:'POST',body:'{}'})),e=>e.status===415);
});
test('write origin fails closed before business mutation',()=>{
  assert.doesNotThrow(()=>requireOfficeOrigin(new Request('http://local',{headers:{origin:'https://zaky.test'}}),'https://zaky.test'));
  for(const origin of ['https://evil.test','https://zaky.test.evil','null'])assert.throws(()=>requireOfficeOrigin(new Request('http://local',{headers:{origin}}),'https://zaky.test'),e=>e.status===403);
});
test('SSE sends full snapshot, closes on permission loss and cancellation stops further reads',async()=>{
  let calls=0;
  const reader=snapshotStream({read:async()=>{if(++calls>1)throw new Error('revoked');return {items:[{id:'one'}]};},intervalMs:5,lifetimeMs:100}).getReader();
  const first=new TextDecoder().decode((await reader.read()).value);assert.match(first,/event: snapshot/);assert.match(first,/"id":"one"/);
  const second=new TextDecoder().decode((await reader.read()).value);assert.match(second,/event: unavailable/);assert.doesNotMatch(second,/revoked/);assert.equal((await reader.read()).done,true);
  let n=0;const cancelled=snapshotStream({read:async()=>({n:++n}),intervalMs:10,lifetimeMs:100}).getReader();await cancelled.read();await cancelled.cancel();const seen=n;await new Promise(resolve=>setTimeout(resolve,25));assert.equal(n,seen);
});
