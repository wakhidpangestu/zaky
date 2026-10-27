import { STATUS_LABELS, type OfficeTask, type StationId } from './model.ts';

export interface WorkflowActor { id:string; lembagaId:string; unitId:string; peran:string; nama:string }
export interface WorkItem {
  id:string; lembagaId:string; referenceType:'penerimaan'|'penyaluran'; referenceId:string;
  code:string; stage:StationId; status:'open'|'completed'|'cancelled'; version:number;
  assignedRole:string; assignedUserId:string|null; creatorId:string; creatorUnitId:string;
  witnessIds:string[]; witnessUnitIds:string[]; domainStatus:string; method:string;
  destination:string; amount:string; eligibleUserIds:string[]; updatedAt:string;
}
export interface TeamMember extends WorkflowActor { unitName:string }
export interface Presence { userId:string; nama:string; station:StationId|null; lastSeenAt:string }
export interface WorkHistory { id:string; type:string; actorName:string|null; createdAt:string; reason:string }
export interface WorkflowSnapshot { actor:WorkflowActor; items:WorkItem[]; members:TeamMember[]; presence:Presence[]; serverTime:string }
export interface AssignmentInput { itemId:string; version:number; requestId:string; action:'claim'|'handoff'|'release'; targetUserId:string|null; reason:string }
export const isUuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function parseAssignment(value:unknown):AssignmentInput|null {
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const r=value as Record<string,unknown>;
  if(!isUuid(r.itemId)||!isUuid(r.requestId)||!Number.isSafeInteger(r.version)||(r.version as number)<1||!['claim','handoff','release'].includes(String(r.action)))return null;
  const reason=typeof r.reason==='string'?r.reason.trim():'';
  if((r.reason!==undefined&&typeof r.reason!=='string')||reason.length>500||/[\u0000-\u001f]/.test(reason))return null;
  if(r.action==='handoff'&&(!isUuid(r.targetUserId)||!reason))return null;
  if(r.action!=='handoff'&&r.targetUserId!=null)return null;
  return {itemId:r.itemId,version:r.version as number,requestId:r.requestId,action:r.action as AssignmentInput['action'],targetUserId:r.action==='handoff'?r.targetUserId as string:null,reason};
}
export function parseHeartbeat(value:unknown):{sessionId:string;station:StationId|null}|null {
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const r=value as Record<string,unknown>;
  if(!isUuid(r.sessionId)||(r.station!==null&&!['penerimaan','saksi','persetujuan','penyaluran','catatan'].includes(String(r.station))))return null;
  return {sessionId:r.sessionId,station:r.station as StationId|null};
}
/** Shared display policy; SQL repeats these checks with current database identity. */
export function eligibleForWork(item:WorkItem,actor:WorkflowActor):boolean {
  if(item.status!=='open'||actor.lembagaId!==item.lembagaId||actor.peran!==item.assignedRole)return false;
  if(item.stage==='penyaluran')return actor.id===item.creatorId;
  if(item.stage!=='saksi'&&item.stage!=='persetujuan')return false;
  if(actor.id===item.creatorId||actor.unitId===item.creatorUnitId||item.witnessIds.includes(actor.id)||item.witnessUnitIds.includes(actor.unitId))return false;
  return item.stage!=='saksi'||item.witnessIds.length<2;
}
export function toOfficeTask(item:WorkItem):OfficeTask {
  return {id:item.id,code:item.code,station:item.stage,status:item.domainStatus,label:STATUS_LABELS[item.domainStatus]??'Penerimaan tercatat',destination:item.destination,amount:Number(item.amount),done:item.status==='completed',terminal:item.status!=='open',method:item.method,creator:item.creatorId,creatorUnit:item.creatorUnitId,witnessNames:item.witnessIds,witnessUnits:item.witnessUnitIds,path:item.stage==='persetujuan'?'/persetujuan':item.referenceType==='penerimaan'?'/penerimaan':'/penyaluran'};
}
