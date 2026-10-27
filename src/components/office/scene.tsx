'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STATIONS, type StationId } from '@/lib/office/model';
interface Props { selected:StationId|null; counts:Record<StationId,number>; reset:number; onSelect:(id:StationId)=>void; onError:()=>void }
/** Procedural room: no external models, trackers, or simulated online users. */
export default function OfficeScene(props:Props) {
  const mount=useRef<HTMLDivElement>(null), latest=useRef(props);
  const api=useRef<{select:(id:StationId|null)=>void;counts:(v:Record<StationId,number>)=>void;reset:()=>void}|null>(null);
  useEffect(()=>{latest.current=props;api.current?.select(props.selected);api.current?.counts(props.counts);},[props]);
  useEffect(()=>{api.current?.reset();},[props.reset]);
  useEffect(()=>{
    const host=mount.current;if(!host)return;
    let renderer:THREE.WebGLRenderer;
    try {renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}
    catch {latest.current.onError();return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0xeff4f0,1);
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('role','img');
    renderer.domElement.setAttribute('aria-label','Kantor dengan lima meja. Gunakan daftar meja untuk navigasi keyboard.');
    const scene=new THREE.Scene(), camera=new THREE.OrthographicCamera(-12,12,9,-9,.1,100);
    const controls=new OrbitControls(camera,renderer.domElement);
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    controls.enableDamping=!reduced;controls.dampingFactor=.12;controls.enablePan=false;
    controls.minPolarAngle=.35;controls.maxPolarAngle=1.2;controls.minZoom=.65;controls.maxZoom=2.2;
    function reset(){camera.position.set(17,17,21);camera.zoom=1;camera.updateProjectionMatrix();controls.target.set(0,.3,0);controls.update();}
    reset();
    scene.add(new THREE.HemisphereLight(0xffffff,0xb1c3b6,2.6));
    const sun=new THREE.DirectionalLight(0xfff6e3,2.6);sun.position.set(-4,15,8);sun.castShadow=true;
    sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:.1,far:50});
    sun.shadow.normalBias=.03;scene.add(sun);
    const material=(color:number)=>new THREE.MeshStandardMaterial({color,roughness:.85,metalness:0});
    const green=material(0x155d4d),light=material(0xd9e9df),white=material(0xf5f5eb),wood=material(0xc49d5e),ink=material(0x253a35),skin=material(0xd8ad8a);
    function box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material){
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
    }
    function cylinder(parent:THREE.Object3D,r:number,h:number,x:number,y:number,z:number,mat:THREE.Material){
      const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
    }
    box(scene,18.4,.35,13.4,0,-.25,0,green);box(scene,18,.14,13,0,-.02,0,material(0xe9e4d4));
    box(scene,18,2.5,.18,0,1.25,-6.5,white);box(scene,.18,2.5,13,-9,1.25,0,white);
    box(scene,18,.11,.22,0,.2,-6.35,wood);box(scene,.22,.11,13,-8.85,.2,0,wood);
    const grid=new THREE.GridHelper(18,18,0xd7d2c4,0xd7d2c4);grid.position.y=.06;grid.scale.z=13/18;scene.add(grid);
    cylinder(scene,2.1,.025,0,.09,.1,green);cylinder(scene,1.55,.03,0,.11,.1,light);
    const ring=new THREE.Mesh(new THREE.RingGeometry(1.98,2.03,48),wood);ring.rotation.x=-Math.PI/2;ring.position.set(0,.13,.1);scene.add(ring);
    function plant(x:number,z:number){
      cylinder(scene,.38,.65,x,.4,z,white);cylinder(scene,.06,1.4,x,1.25,z,wood);
      for(let i=0;i<5;i++){const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.55,0),green);leaf.position.set(x+Math.sin(i*2)*.3,1.5+i*.13,z+Math.cos(i*2)*.3);leaf.scale.set(1,.55,1);scene.add(leaf);}
    }
    plant(-7.8,-5.3);plant(7.8,-5.3);plant(7.8,5.3);
    box(scene,3,.55,1.1,-6.7,.5,4.8,green);box(scene,3,1.1,.3,-6.7,.8,5.3,light);
    function person(parent:THREE.Object3D,x:number,z:number,coat:THREE.Material,scale=1){
      const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);
      box(g,.46,.65,.32,0,.9,0,coat);const head=new THREE.Mesh(new THREE.SphereGeometry(.23,12,10),skin);head.position.y=1.5;g.add(head);
      box(g,.42,.12,.35,0,1.7,0,ink);box(g,.15,.45,.17,-.13,.35,0,ink);box(g,.15,.45,.17,.13,.35,0,ink);parent.add(g);return g;
    }
    function label(text:string){
      const canvas=document.createElement('canvas');canvas.width=768;canvas.height=144;
      const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas labels unavailable');
      ctx.fillStyle='#ffffff';ctx.fillRect(0,0,768,144);ctx.strokeStyle='#b9d3c5';ctx.lineWidth=6;ctx.strokeRect(3,3,762,138);
      ctx.fillStyle='#164f42';ctx.font='600 35px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,72,720);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));sprite.scale.set(3.7,.69,1);return sprite;
    }
    const labels=new Map<StationId,THREE.Sprite>(),papers=new Map<StationId,THREE.Mesh[]>(),clickable:THREE.Object3D[]=[];
    const selection=new THREE.Mesh(new THREE.RingGeometry(1.35,1.45,40),material(0xc89b44));selection.rotation.x=-Math.PI/2;selection.visible=false;scene.add(selection);
    for(const station of STATIONS){
      const desk=new THREE.Group();desk.position.set(...station.position);desk.userData.station=station.id;scene.add(desk);clickable.push(desk);
      box(desk,2.6,.16,1.35,0,1.1,0,white);for(const x of [-1.1,1.1])for(const z of [-.48,.48])cylinder(desk,.045,1.05,x,.54,z,wood);
      const screenWidth=station.id==='catatan'?1.5:.8;
      box(desk,screenWidth,.5,.07,.35,1.53,-.35,ink);box(desk,screenWidth-.1,.39,.02,.35,1.53,-.30,station.id==='catatan'?green:material(0xa5d3cf));
      cylinder(desk,.05,.22,.35,1.26,-.35,ink);box(desk,.6,.035,.22,.35,1.2,.15,ink);
      box(desk,.65,.16,.65,.15,.55,1.1,green);box(desk,.65,.65,.12,.15,.9,1.38,green);person(desk,.15,1,light,.7);
      const stack:THREE.Mesh[]=[];for(let i=0;i<3;i++)stack.push(box(desk,.55,.045,.42,-.65,1.22+i*.05,.1,wood));papers.set(station.id,stack);
      const tag=label(station.title);tag.position.set(0,2.65,0);desk.add(tag);labels.set(station.id,tag);
    }
    const brand=label('ZAKY / KANTOR AMANAH');brand.position.set(0,3.3,-6.3);brand.scale.set(5.5,1,1);scene.add(brand);
    const avatar=person(scene,0,4.5,green), destination=new THREE.Vector3(0,0,4.5);let selected:StationId|null=null;
    function select(id:StationId|null){
      if(id===selected)return;selected=id;if(!id){selection.visible=false;return;}
      const s=STATIONS.find(v=>v.id===id);if(!s)return;
      destination.set(s.position[0],0,s.position[2]+1.95);selection.position.set(s.position[0],.15,s.position[2]);selection.visible=true;
      if(reduced)avatar.position.copy(destination);
    }
    function updateCounts(counts:Record<StationId,number>){
      for(const s of STATIONS){
        const sprite=labels.get(s.id)!;const text=`${s.title}${counts[s.id]?' / '+counts[s.id]+' tugas':''}`;
        if(sprite.userData.text===text)continue;sprite.userData.text=text;
        const replacement=label(text),old=sprite.material.map;sprite.material.map=replacement.material.map;sprite.material.needsUpdate=true;
        old?.dispose();replacement.material.dispose();papers.get(s.id)?.forEach((p,i)=>p.visible=i<Math.min(counts[s.id],3));
      }
    }
    api.current={select,counts:updateCounts,reset};select(latest.current.selected);updateCounts(latest.current.counts);
    const observer=new ResizeObserver(()=>{
      const w=host.clientWidth,h=Math.max(host.clientHeight,320);if(w<=0)return;const aspect=w/h;
      camera.left=-9*aspect;camera.right=9*aspect;camera.top=9;camera.bottom=-9;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
    });observer.observe(host);
    const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down:{x:number;y:number}|null=null;
    const pointerDown=(event:PointerEvent)=>{down=event.isPrimary?{x:event.clientX,y:event.clientY}:null;};
    const pointerUp=(event:PointerEvent)=>{
      if(!down||Math.hypot(event.clientX-down.x,event.clientY-down.y)>7){down=null;return;}down=null;
      const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
      ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(clickable,true)[0];let obj:THREE.Object3D|null=hit?.object??null;
      while(obj&&!obj.userData.station)obj=obj.parent;if(obj?.userData.station)latest.current.onSelect(obj.userData.station as StationId);
    };
    const lost=(event:Event)=>{event.preventDefault();latest.current.onError();};
    renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('webglcontextlost',lost);
    let raf=0,previous=0,disposed=false;
    const tick=(time:number)=>{
      if(disposed||document.hidden)return;raf=requestAnimationFrame(tick);if(time-previous<33)return;
      const dt=Math.min((time-previous)/1000,.05);previous=time;const distance=avatar.position.distanceTo(destination);
      if(distance>.04){avatar.rotation.y=Math.atan2(destination.x-avatar.position.x,destination.z-avatar.position.z);avatar.position.lerp(destination,Math.min(1,dt*4/distance));}
      controls.update();renderer.render(scene,camera);
    };
    const visibility=()=>{cancelAnimationFrame(raf);if(!document.hidden){previous=0;raf=requestAnimationFrame(tick);}};
    document.addEventListener('visibilitychange',visibility);raf=requestAnimationFrame(tick);
    return ()=>{
      disposed=true;cancelAnimationFrame(raf);observer.disconnect();document.removeEventListener('visibilitychange',visibility);
      renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('webglcontextlost',lost);
      controls.dispose();const materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
      scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}if(o instanceof THREE.Sprite)materials.add(o.material);});
      materials.forEach(m=>{const map=(m as THREE.MeshStandardMaterial).map;if(map)textures.add(map);m.dispose();});textures.forEach(t=>t.dispose());
      sun.shadow.dispose();renderer.dispose();renderer.domElement.remove();api.current=null;
    };
  },[]);
  return <div className="zo-canvas" ref={mount}/>;
}
