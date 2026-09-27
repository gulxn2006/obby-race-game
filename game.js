import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const socket = window.io();
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x8bd8ff); scene.fog = new THREE.Fog(0x8bd8ff, 55, 180);
const camera = new THREE.PerspectiveCamera(65, innerWidth/innerHeight, .1, 350);
const renderer = new THREE.WebGLRenderer({antialias:true}); renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15; document.body.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xc9f2ff,0x5b6a9a,2.0)); const sun=new THREE.DirectionalLight(0xfff4d6,3.2); sun.position.set(-18,35,15); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); scene.add(sun);
const mat=(color,roughness=.7)=>new THREE.MeshStandardMaterial({color,roughness});
const platformMat=mat(0x5a6ff0), edgeMat=mat(0x2b3e9c), goldMat=mat(0xffcf45), whiteMat=mat(0xffffff), pinkMat=mat(0xff5caa), cyanMat=mat(0x38e5df), greenMat=mat(0x53d88a);
function box(w,h,d,material,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
// Floating raceway
box(14,1,20,platformMat,0,-.55,4); box(14,1,12,platformMat,0,-.55,-14); box(10,1,12,platformMat,0,-.55,-32); box(14,1,14,platformMat,0,-.55,-51); box(12,1,16,platformMat,0,-.55,-74); box(16,1,22,platformMat,0,-.55,-99);
// Bright side rails and course markers
for(const z of [4,-14,-32,-51,-74,-99]){let width=(z===-32?10:(z===-74?12:14));box(.28,.35,12,cyanMat,-width/2+.14,-.1,z);box(.28,.35,12,pinkMat,width/2-.14,-.1,z);}
// Stepping stones
for(let i=0;i<7;i++){let x=(i%2?2.7:-2.7);box(3.2,.55,3.1,i%2?pinkMat:cyanMat,x,-.05,-25-i*5.0);}
// Hurdles on main platforms
for(const z of [-7,-17,-43,-61,-88]){box(7,.7,.65,goldMat,0,.35,z);box(.35,1.4,.8,pinkMat,-3.2,.7,z);box(.35,1.4,.8,pinkMat,3.2,.7,z);}
// Checkpoint arches and finish gate
function gate(z,color,label){box(.35,4,.45,mat(color),-5,1.6,z);box(.35,4,.45,mat(color),5,1.6,z);box(10,.45,.55,mat(color),0,3.55,z);}
gate(-51,0x52ffb0);gate(-106,0xffd34e);
// Decorative clouds
for(let i=0;i<32;i++){const g=new THREE.Group();const c=mat(i%2?0xffffff:0xe9f8ff);for(let j=0;j<4;j++){const s=new THREE.Mesh(new THREE.SphereGeometry(1.7+Math.random()*1.3,12,10),c);s.position.set(j*2.0,Math.random()*1.0,Math.random()*1.2);g.add(s);}g.position.set((Math.random()-.5)*100,8+Math.random()*20,-Math.random()*130);scene.add(g);}
// Player avatars
function makeAvatar(color=0xffa02e){const group=new THREE.Group();const body=new THREE.Mesh(new THREE.CapsuleGeometry(.52,.85,5,10),mat(color,.45));body.position.y=1.15;body.castShadow=true;group.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.42,18,16),mat(0xffd1a3,.6));head.position.y=2.0;head.castShadow=true;group.add(head);const visor=new THREE.Mesh(new THREE.BoxGeometry(.55,.16,.12),mat(0x17264c,.25));visor.position.set(0,2.04,.36);group.add(visor);const footmat=mat(0xffffff);for(const x of [-.28,.28]){const f=new THREE.Mesh(new THREE.BoxGeometry(.36,.22,.55),footmat);f.position.set(x,.22,.1);group.add(f);}return group;}
const me=makeAvatar(0xffa02e);scene.add(me);const others=new Map();let myId=null;let started=false,finished=false,checkpoint=0;const keys={};let velocityY=0,onGround=true;const speed=9.2, gravity=23;const startPos=new THREE.Vector3(0,0,8);me.position.copy(startPos);
function showToast(t){const el=document.getElementById('toast');el.textContent=t;el.style.display='block';clearTimeout(showToast.t);showToast.t=setTimeout(()=>el.style.display='none',2200);}
socket.on('welcome',data=>{myId=data.id;for(const p of Object.values(data.players)){if(p.id!==myId)addOther(p);}updateCount();});socket.on('playerJoined',p=>{addOther(p);updateCount();showToast(`${p.name} joined the race!`);});socket.on('playerMoved',p=>{if(p.id===myId)return;let o=others.get(p.id);if(!o){addOther(p);o=others.get(p.id);}o.target.set(p.x,p.y,p.z);o.name=p.name;o.finished=p.finished;});socket.on('playerLeft',id=>{const o=others.get(id);if(o){scene.remove(o.mesh);others.delete(id);}updateCount();});
function addOther(p){const mesh=makeAvatar(new THREE.Color(p.color).getHex());mesh.position.set(p.x,p.y,p.z);scene.add(mesh);others.set(p.id,{mesh,target:new THREE.Vector3(p.x,p.y,p.z),name:p.name||'Runner',finished:p.finished});}
function updateCount(){document.getElementById('online').textContent=others.size+1;}
function reset(){me.position.copy(startPos);velocityY=0;checkpoint=0;finished=false;document.getElementById('cp').textContent='START';document.getElementById('status').textContent='Racing';}
document.getElementById('start').onclick=()=>{started=true;document.getElementById('start').style.display='none';document.getElementById('message').textContent='GO! GO! GO!';document.getElementById('hint').textContent='Reach the golden finish gate!';showToast('Race started!');};
addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='KeyR')reset();if(e.code==='Space'&&onGround&&started){velocityY=10.5;onGround=false;}});addEventListener('keyup',e=>keys[e.code]=false);
document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;const down=e=>{e.preventDefault();keys[k]=true;if(k==='jump'&&onGround&&started){velocityY=10.5;onGround=false;}};const up=e=>{e.preventDefault();keys[k]=false;};b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointerleave',up);b.addEventListener('pointercancel',up);});
function moveAxis(a,b){return (keys[a]||keys[b]?-1:0)+(keys[a+'2']||keys[b+'2']?1:0);}
let last=performance.now(),sendTimer=0;
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.04);last=now;
 if(started&&!finished){let dx=0,dz=0;if(keys.KeyA||keys.ArrowLeft||keys.left)dx-=1;if(keys.KeyD||keys.ArrowRight||keys.right)dx+=1;if(keys.KeyW||keys.ArrowUp)dz-=1;if(keys.KeyS||keys.ArrowDown)dz+=1;const len=Math.hypot(dx,dz)||1;me.position.x+=dx/len*speed*dt;me.position.z+=dz/len*speed*dt;me.position.x=THREE.MathUtils.clamp(me.position.x,-6.2,6.2);velocityY-=gravity*dt;me.position.y+=velocityY*dt;
 // Approximate platform collision zones
 const z=me.position.z;const onPlatform=(z<=14&&z>=-6)||(z<=-8&&z>=-20)||(z<=-26&&z>=-38)||(z<=-44&&z>=-58)||(z<=-66&&z>=-82)||(z<=-88&&z>=-111);
 if(onPlatform&&me.position.y<=0){me.position.y=0;velocityY=0;onGround=true;}else onGround=false;
 if(z<-49&&checkpoint<1){checkpoint=1;document.getElementById('cp').textContent='1';showToast('Checkpoint reached!');}
 if(z<-106&&!finished){finished=true;document.getElementById('message').textContent='🏆 FINISH!';document.getElementById('hint').textContent='You made it across the sky!';document.getElementById('status').textContent='Finished';showToast('You crossed the finish line!');}
 if(me.position.y < -12){showToast('Oops! Back to checkpoint.');if(checkpoint===1){me.position.set(0,0,-49);}else reset();velocityY=0;}
 }
 // Remote interpolation
 for(const o of others.values()){o.mesh.position.lerp(o.target,Math.min(1,dt*12));}
 const target=new THREE.Vector3(me.position.x,me.position.y+2.0,me.position.z+5.5);camera.position.lerp(new THREE.Vector3(me.position.x,me.position.y+6.5,me.position.z+12),Math.min(1,dt*4));camera.lookAt(target);
 sendTimer+=dt;if(sendTimer>.06){socket.emit('move',{x:me.position.x,y:me.position.y,z:me.position.z,finished});sendTimer=0;}
 renderer.render(scene,camera);
}
requestAnimationFrame(animate);addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
</script>
