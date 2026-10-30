import { getOfficeActor, reloadActor, loadWorkflowSnapshot } from '@/lib/office/workflow-server';
import { officeFailure } from '@/lib/office/http';
import { snapshotStream } from '@/lib/office/snapshot-stream';
export async function GET(request:Request){
  try {
    let actor=await getOfficeActor();
    return new Response(snapshotStream({signal:request.signal,read:async()=>{
      actor=await reloadActor(actor);
      return loadWorkflowSnapshot(actor);
    }}),{headers:{'Content-Type':'text/event-stream','Cache-Control':'private, no-store, no-transform','Vary':'Cookie','X-Accel-Buffering':'no'}});
  }catch(error){return officeFailure(error);}
}
