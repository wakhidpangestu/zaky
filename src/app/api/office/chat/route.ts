import { getSession } from '@/lib/auth';
import { getDbPool, query } from '@/lib/db';
import { parseChatInput, sameOrigin } from '@/lib/office/model';
import { hasStrongJwtSecret } from '@/lib/secret';
class HttpError extends Error {
  status:number;
  constructor(status:number,message:string){super(message);this.status=status;}
}
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
interface Actor {id:string;lembaga_id:string;nama:string}
async function actor():Promise<Actor>{
  // Current repo login is public demo authentication. Explicit acknowledgement is
  // required; this flag does NOT make demo credentials safe for production.
  if(process.env.OFFICE_CHAT_ENABLED!=='true'||process.env.OFFICE_CHAT_DEMO_ACK!=='true'||!hasStrongJwtSecret()){
    throw new HttpError(503,'Chat demo belum diaktifkan. Administrator perlu menyiapkan migrasi database dan konfigurasi chat.');
  }
  const session=await getSession();
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if(!session||!uuid.test(session.userId)||!uuid.test(session.lembagaId))throw new HttpError(401,'Sesi tidak valid. Masuk ulang untuk memakai chat.');
  const result=await query<Actor>('SELECT a.id,a.lembaga_id,a.nama FROM akun a JOIN lembaga l ON l.id=a.lembaga_id WHERE a.id=$1 AND a.lembaga_id=$2 AND a.aktif AND l.aktif',[session.userId,session.lembagaId]);
  if(!result.rows[0])throw new HttpError(401,'Akun aktif untuk lembaga ini tidak ditemukan.');
  return result.rows[0];
}
function failure(error:unknown){
  if(error instanceof HttpError)return json({error:error.message},error.status);
  console.error('Office chat unavailable',error instanceof Error?error.name:'UnknownError');
  return json({error:'Layanan chat belum tersedia. Periksa koneksi database dan migrasi 004.'},503);
}
async function smallJson(request:Request):Promise<unknown>{
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw new HttpError(415,'Gunakan JSON.');
  const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Pesan kosong.');
  const chunks:Uint8Array[]=[];let size=0;
  try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192){await reader.cancel();throw new HttpError(413,'Pesan terlalu besar.');}chunks.push(value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new HttpError(400,'Format pesan tidak valid.');}
}
export async function GET(){
  try {
    const account=await actor();
    const result=await query<{id:string;nama:string;text:string;createdAt:string}>(
      'SELECT m.id::text,m.body AS text,m.created_at AS "createdAt",a.nama FROM office_messages m JOIN akun a ON a.id=m.akun_id WHERE m.lembaga_id=$1 ORDER BY m.id DESC LIMIT 60',[account.lembaga_id]);
    return json({messages:result.rows.reverse()});
  }catch(error){return failure(error);}
}
export async function POST(request:Request){
  try {
    if(!sameOrigin(process.env.APP_URL,request.headers.get('origin')))throw new HttpError(403,'Asal permintaan tidak diizinkan. Periksa APP_URL.');
    const account=await actor(),input=parseChatInput(await smallJson(request));
    if(!input)throw new HttpError(400,'Pesan wajib 1-1000 karakter dengan ID pengiriman valid.');
    const client=await getDbPool().connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',['office-chat:'+account.id]);
      const existing=await client.query<{id:string;body:string}>('SELECT id::text,body FROM office_messages WHERE lembaga_id=$1 AND akun_id=$2 AND client_id=$3',[account.lembaga_id,account.id,input.clientId]);
      if(existing.rows[0]){
        if(existing.rows[0].body!==input.text)throw new HttpError(409,'ID pesan sudah dipakai untuk isi berbeda.');
        await client.query('COMMIT');return json({id:existing.rows[0].id,duplicate:true});
      }
      const rate=await client.query<{n:string}>('SELECT count(*)::text AS n FROM office_messages WHERE akun_id=$1 AND created_at>now()-interval \'60 seconds\'',[account.id]);
      if(Number(rate.rows[0].n)>=20)throw new HttpError(429,'Terlalu banyak pesan. Coba lagi setelah satu menit.');
      const result=await client.query<{id:string}>('INSERT INTO office_messages(lembaga_id,akun_id,client_id,body) VALUES($1,$2,$3,$4) ON CONFLICT(lembaga_id,akun_id,client_id) DO NOTHING RETURNING id::text',[account.lembaga_id,account.id,input.clientId,input.text]);
      if(!result.rows[0])throw new HttpError(409,'Pesan belum dapat dikonfirmasi. Coba kirim lagi dengan ID yang sama.');
      await client.query('COMMIT');return json({id:result.rows[0].id},201);
    }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  }catch(error){return failure(error);}
}
