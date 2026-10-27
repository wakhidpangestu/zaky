import { getOfficeActor } from '@/lib/office/workflow-server';
import { officeJson, officeFailure, OfficeHttpError, requireOfficeOrigin, readOfficeJson } from '@/lib/office/http';
import { parseHeartbeat } from '@/lib/office/workflow';
import { query } from '@/lib/db';
export async function POST(request:Request){
  try {
    requireOfficeOrigin(request,process.env.APP_URL);
    const actor=await getOfficeActor(),input=parseHeartbeat(await readOfficeJson(request));
    if(!input)throw new OfficeHttpError(400,'Heartbeat tidak valid.');
    await query('SELECT office_heartbeat($1,$2,$3)',[actor.id,input.sessionId,input.station]);
    return officeJson({ok:true,ttlSeconds:60});
  }catch(error){return officeFailure(error);}
}
export async function DELETE(request:Request){
  try {
    requireOfficeOrigin(request,process.env.APP_URL);
    const actor=await getOfficeActor(),input=parseHeartbeat(await readOfficeJson(request));
    if(!input)throw new OfficeHttpError(400,'Sesi presence tidak valid.');
    await query('DELETE FROM office_presence WHERE session_id=$1 AND akun_id=$2 AND lembaga_id=$3',[input.sessionId,actor.id,actor.lembagaId]);
    return officeJson({ok:true});
  }catch(error){return officeFailure(error);}
}
