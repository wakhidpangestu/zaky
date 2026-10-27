import { getOfficeActor, loadWorkflowSnapshot, assignWork } from '@/lib/office/workflow-server';
import { officeJson, officeFailure, OfficeHttpError, requireOfficeOrigin, readOfficeJson } from '@/lib/office/http';
import { parseAssignment } from '@/lib/office/workflow';
import { query } from '@/lib/db';
export async function GET(request:Request){
  try {
    const actor=await getOfficeActor();
    const itemId=new URL(request.url).searchParams.get('history');
    if(itemId){
      const {isUuid}=await import('@/lib/office/workflow');
      if(!isUuid(itemId))throw new OfficeHttpError(400,'ID tugas tidak valid.');
      const exists=await query('SELECT 1 FROM work_items WHERE id=$1 AND lembaga_id=$2',[itemId,actor.lembagaId]);
      if(!exists.rowCount)throw new OfficeHttpError(404,'Pekerjaan tidak ditemukan.');
      const history=await query(`SELECT e.id::text,e.type,a.nama AS "actorName",e.created_at AS "createdAt",e.reason
        FROM work_events e LEFT JOIN akun a ON a.id=e.actor_id AND a.lembaga_id=e.lembaga_id WHERE e.work_item_id=$1 AND e.lembaga_id=$2 ORDER BY e.id DESC LIMIT 50`,[itemId,actor.lembagaId]);
      return officeJson({history:history.rows});
    }
    return officeJson(await loadWorkflowSnapshot(actor));
  }catch(error){return officeFailure(error);}
}
export async function POST(request:Request){
  try {
    requireOfficeOrigin(request,process.env.APP_URL);
    const actor=await getOfficeActor(),input=parseAssignment(await readOfficeJson(request));
    if(!input)throw new OfficeHttpError(400,'Data assignment tidak valid.');
    return officeJson({item:await assignWork(actor,input)});
  }catch(error){return officeFailure(error);}
}
