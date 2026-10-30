/** Bounded SSE: each event replaces client state; reconnect cannot miss a delta. */
export function snapshotStream({read,signal,intervalMs=3000,lifetimeMs=25000}:{read:()=>Promise<unknown>;signal?:AbortSignal;intervalMs?:number;lifetimeMs?:number}):ReadableStream<Uint8Array>{
  let stop=()=>{};
  return new ReadableStream({
    start(controller){
      let closed=false,timer:ReturnType<typeof setTimeout>|undefined;
      const encoder=new TextEncoder();
      const cleanup=()=>{closed=true;clearTimeout(timer);clearTimeout(deadline);signal?.removeEventListener('abort',close);};
      const close=()=>{if(closed)return;cleanup();controller.close();};
      const deadline=setTimeout(close,lifetimeMs);
      stop=cleanup;signal?.addEventListener('abort',close,{once:true});
      async function tick(){
        try {
          const snapshot=await read();if(closed)return;
          controller.enqueue(encoder.encode(`retry: 3000\nevent: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`));
          timer=setTimeout(tick,intervalMs);
        }catch{if(!closed){controller.enqueue(encoder.encode('event: unavailable\ndata: {}\n\n'));close();}}
      }
      if(signal?.aborted)close();else void tick();
    },
    cancel(){stop();},
  });
}
