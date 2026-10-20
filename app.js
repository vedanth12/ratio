/* Ratio — case study app for Indian law students.
   Data: data/cases.json (landmark cases + new judgments, updated daily), data/syllabus.json (course reading lists).
   Everything the student writes stays on the device (localStorage). */
(function(){
"use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ico=(n,cls="ico")=>`<svg class="${cls}"><use href="#i-${n}"/></svg>`;
const store={get(k,d){try{const v=localStorage.getItem("ratio2."+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem("ratio2."+k,JSON.stringify(v))}catch(e){}}};
const KEYS=["revised","saved","briefs","mytags","custom","prefs","srs","days","recent"];
const DEF={custom:[],recent:[],days:[]};
const U={};KEYS.forEach(k=>U[k]=store.get(k,DEF[k]||{}));
const persist=k=>store.set(k,U[k]);
const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const addDays=(iso,n)=>{const d=new Date(iso+"T00:00");d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
const toast=t=>{const el=$("#toast");el.textContent=t;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),2000)};
const STATUS={good:["good","Good law"],bad:["bad","Overruled"],mod:["mod","Modified / codified"]};
const HUES=[["#1D5C52","#DDEDE8"],["#2F4A7A","#E1E8F4"],["#9A5B00","#F7ECD7"],["#7A3B69","#F2E3EE"],["#3E6B2A","#E5F0DE"],["#8A3A2E","#F6E3DF"],["#335F78","#E0ECF2"]];
const hue=s=>{let h=0;for(const ch of s)h=(h*31+ch.charCodeAt(0))>>>0;return HUES[h%HUES.length]};

let DB={cases:[],syllabus:[],updated:null,school:""};
const S={tab:"home",listTab:"library",col:null,caseId:null,recall:false,limit:100,ids:[]};

/* ---------------- data ---------------- */
async function getJSON(u){const r=await fetch(u,{cache:"no-cache"});if(!r.ok)throw new Error(u);return r.json()}
async function load(){
  try{
    const [c,s]=await Promise.all([getJSON("data/cases.json"),getJSON("data/syllabus.json").catch(()=>({cases:[]}))]);
    DB.cases=c.cases;DB.updated=c.updated;
    DB.syllabus=(s.cases||[]).map(x=>({...x,kind:"syllabus",subjects:[x.course],topic:x.topics[0]}));DB.school=s.school||"";
  }catch(e){$("#v-home").innerHTML=`<div class="empty">Couldn't load the cases. Check your connection and open Ratio again.</div>`;return}
  badges();route();
}
const custom=()=>U.custom.map(c=>({...c,kind:"custom"}));
const all=()=>DB.cases.concat(DB.syllabus,custom());
let _idx=null;const byId=id=>{if(!_idx||_idx.n!==all().length){_idx=new Map(all().map(c=>[c.id,c]));_idx.n=_idx.size}return _idx.get(id)};
const tagOf=c=>U.mytags[c.id]||c.tag||"";
const landmarks=()=>DB.cases.filter(c=>c.kind==="landmark");
const news=()=>DB.cases.filter(c=>c.kind==="new");
const courses=()=>[...new Set(DB.syllabus.map(c=>c.course))];
const subjects=list=>{const m=new Map();list.forEach(c=>c.subjects.forEach(s=>m.set(s,(m.get(s)||0)+1)));return [...m].sort((a,b)=>b[1]-a[1])};
const courtKind=c=>c.kind==="syllabus"?"sy":c.kind==="landmark"?"lm":/High Court/.test(c.court||"")?"hc":"sc";
const shortCourt=c=>(c||"").replace("Supreme Court of India","Supreme Court");
const dateLabel=c=>c.reported||(c.date?new Date(c.date+"T00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):String(c.year||""));
function markDay(){const t=today();if(!U.days.includes(t)){U.days.push(t);U.days=U.days.slice(-400);persist("days")}}
function streak(){let n=0,d=today();const set=new Set(U.days);if(!set.has(d))d=addDays(d,-1);while(set.has(d)){n++;d=addDays(d,-1)}return n}
function dueIds(){const t=today();return Object.entries(U.srs).filter(([id,v])=>v.due<=t&&byId(id)).map(([id])=>id)}
function badges(){
  const last=U.prefs.lastSeen||"";const fresh=last?news().filter(c=>(c.added||"")>last).length:0;
  const b=$("#badge");b.hidden=!fresh;b.textContent=fresh;
  const due=dueIds().length;const d=$("#duebadge");d.hidden=!due;d.textContent=due;
}
function setRevised(id,v){if(v)U.revised[id]=today();else delete U.revised[id];persist("revised");if(v)markDay()}
function toggleSave(id){if(U.saved[id])delete U.saved[id];else U.saved[id]=today();persist("saved")}

/* ---------------- routing ---------------- */
window.addEventListener("hashchange",route);
function route(){
  const h=decodeURIComponent(location.hash.slice(1))||"home";
  const [head,...rest]=h.split("/");const arg=rest.join("/");
  S.caseId=null;
  if(head==="case"){S.caseId=arg;S.tab=S.listTab}
  else if(head==="library"){S.tab="library";S.listTab="library";S.col=arg||null;S.limit=100}
  else if(head==="new"){S.tab="new";S.listTab="new";S.limit=100}
  else S.tab=["home","revise","me"].includes(head)?head:"home";
  $$("[data-tab]").forEach(a=>a.setAttribute("aria-current",a.dataset.tab===S.tab?"page":"false"));
  const listy=S.caseId||(S.tab==="new")||(S.tab==="library"&&S.col);
  $("#v-home").hidden=!(S.tab==="home"||(S.tab==="library"&&!S.col&&!S.caseId));
  $("#v-list").hidden=!listy;$("#v-revise").hidden=S.tab!=="revise";$("#v-me").hidden=S.tab!=="me";
  if(S.tab==="new"&&!S.caseId){U.prefs.lastSeen=today();persist("prefs");badges()}
  if(S.caseId){if(S.listTab==="library"&&!S.col)S.col=U.prefs.lastCol||"lm:all";renderPane();renderCase()}
  else if(S.tab==="home")renderHome();
  else if(S.tab==="library"&&!S.col)renderLibraryRoot();
  else if(listy){renderPane();if(window.innerWidth>860)renderCase(S.ids[0]);}
  else if(S.tab==="revise")renderRevise();
  else if(S.tab==="me")renderMe();
  $("#listlayout").classList.toggle("reading",!!S.caseId);
  if(S.caseId&&window.innerWidth<=860)window.scrollTo({top:0});
}

/* ---------------- home ---------------- */
function caseOfDay(){
  const pool=landmarks().filter(c=>c.tag);if(!pool.length)return null;
  let h=0;for(const ch of today())h=(h*33+ch.charCodeAt(0))>>>0;return pool[h%pool.length];
}
function renderHome(){
  S.tab="home";
  const hr=new Date().getHours();const greet=hr<12?"Good morning":hr<17?"Good afternoon":"Good evening";
  const due=dueIds().length, st=streak(), nRev=Object.keys(U.revised).length;
  const cod=caseOfDay();const latest=news().slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(courtKind(a)==='sc'?0:1)-(courtKind(b)==='sc'?0:1)).slice(0,30);const mix=[...latest.filter(c=>courtKind(c)==='sc').slice(0,6),...latest.filter(c=>courtKind(c)==='hc').slice(0,4)].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const recent=U.recent.map(byId).filter(Boolean).slice(0,4);
  const lm=landmarks();
  $("#v-home").innerHTML=`
   <div class="hello"><div><div class="label">${new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</div><h1 class="h1">${greet}.</h1></div>
     ${DB.updated?`<span class="sub">Cases updated ${new Date(DB.updated).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span>`:""}</div>
   <div class="stats">
     <a class="card stat ${due?"cta":""}" href="#revise"><b>${due}</b><span>${due?"cards due · revise now":"cards due today"}</span></a>
     <div class="card stat"><b>${st}</b><span>day streak</span></div>
     <div class="card stat"><b>${nRev}</b><span>cases revised</span></div>
   </div>
   ${cod?`<div class="card cotd"><div class="row" style="justify-content:space-between"><span class="label">Case of the day</span><span class="tag lm">${esc(cod.subjects[0])}</span></div>
     <div class="q">${esc(cod.name)}</div><div class="mono" style="color:var(--muted)">${esc(cod.cite||cod.year||"")}</div>
     <div id="cotd-ans" hidden class="ans"><div class="label" style="color:var(--accent)">Principle</div><p style="margin:4px 0 0;font-family:var(--display);font-size:1.12rem">${esc(tagOf(cod))}</p></div>
     <div class="row" style="margin-top:14px"><button class="btn primary" id="cotd-show">Can you recall it? Show</button><a class="btn" href="#case/${encodeURIComponent(cod.id)}">Open case</a></div></div>`:""}
   <div class="sec-h"><h2 class="h2">New judgments</h2><a href="#new">See all ${news().length} →</a></div>
   <div class="hscroll">${mix.map(c=>`<a class="card mini ${courtKind(c)}" href="#case/${encodeURIComponent(c.id)}" data-from="new">
      <div class="row" style="justify-content:space-between"><span class="tag ${courtKind(c)}">${esc(shortCourt(c.court))}</span><span class="mono" style="color:var(--muted)">${esc(dateLabel(c))}</span></div>
      <div class="t">${esc(c.name)}</div><div class="p">${esc(tagOf(c))}</div></a>`).join("")}</div>
   ${recent.length?`<div class="sec-h"><h2 class="h2">Pick up where you left off</h2></div><ul class="cards">${recent.map(c=>itemHTML(c)).join("")}</ul>`:""}
   <div class="sec-h"><h2 class="h2">Subjects</h2><a href="#library">Library →</a></div>
   <div class="tiles">${subjects(lm).slice(0,8).map(([s,n])=>tileHTML("lm:"+s,s,lm.filter(c=>c.subjects.includes(s)))).join("")}</div>`;
  const b=$("#cotd-show");if(b)b.onclick=()=>{$("#cotd-ans").hidden=false;b.remove();markDay()};
  wireItems($("#v-home"));
  $$("#v-home [data-from]").forEach(a=>a.addEventListener("click",()=>{S.listTab=a.dataset.from}));
}
function tileHTML(key,name,list){
  const [fg,bg]=hue(name);const d=list.filter(c=>U.revised[c.id]).length;
  return `<a class="tile" href="#library/${encodeURIComponent(key)}"><span class="badge" style="color:${fg};background:${bg}">${list.length}</span>
    <span class="nm">${esc(name)}</span><span class="ct">${d} of ${list.length} revised</span><span class="bar"><i style="width:${list.length?d/list.length*100:0}%;background:${fg}"></i></span></a>`;
}

/* ---------------- library root ---------------- */
function renderLibraryRoot(){
  const lm=landmarks();const nSaved=Object.keys(U.saved).length;
  $("#v-home").innerHTML=`<h1 class="h1">Library</h1><p class="sub">${lm.length} landmark cases · ${news().length} new judgments · ${DB.syllabus.length} syllabus readings</p>
   <div class="stats" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr))">
     <a class="card stat" href="#library/lm:all"><b>${lm.length}</b><span>All landmark cases</span></a>
     <a class="card stat" href="#library/saved"><b>${nSaved}</b><span>Saved</span></a>
     ${U.custom.length?`<a class="card stat" href="#library/custom"><b>${U.custom.length}</b><span>Added by you</span></a>`:""}
   </div>
   <div class="sec-h"><h2 class="h2">Landmark cases by subject</h2></div>
   <div class="tiles">${subjects(lm).map(([s])=>tileHTML("lm:"+s,s,lm.filter(c=>c.subjects.includes(s)))).join("")}</div>
   ${courses().length?`<div class="sec-h"><h2 class="h2">${esc(DB.school||"My")} syllabus</h2></div>
   <div class="tiles">${courses().map(c=>tileHTML("course:"+c,c,DB.syllabus.filter(x=>x.course===c))).join("")}</div>`:""}`;
}

/* ---------------- list pane ---------------- */
function colInfo(col){
  if(S.listTab==="new")return{title:"New judgments",list:news(),group:c=>c.reported||dateLabel(c)};
  if(col==="saved")return{title:"Saved",list:all().filter(c=>U.saved[c.id]),group:c=>c.kind==="syllabus"?c.course:c.subjects[0]};
  if(col==="custom")return{title:"Added by you",list:custom(),group:c=>c.subjects[0]};
  if(col&&col.startsWith("course:")){const n=col.slice(7);return{title:n,list:DB.syllabus.filter(c=>c.course===n),group:c=>c.topic,syllabus:true}}
  const s=col&&col.startsWith("lm:")?col.slice(3):"all";
  const l=s==="all"?landmarks():landmarks().filter(c=>c.subjects.includes(s));
  return{title:s==="all"?"Landmark cases":s,list:l,group:c=>(s==="all"?c.subjects[0]+" · ":"")+(c.topic||"General"),landmark:true};
}
function filtered(info){
  const p=U.prefs;let l=info.list;
  const q=(S.listTab==="new"?p.qNew:p.qLib)||"";
  if(S.listTab==="new"){
    if(p.court==="sc")l=l.filter(c=>!/High Court/.test(c.court));
    if(p.court==="hc")l=l.filter(c=>/High Court/.test(c.court));
    if(p.subjNew)l=l.filter(c=>c.subjects.includes(p.subjNew));
  }else{
    if(p.topic&&p.topicCol===S.col)l=l.filter(c=>c.topic===p.topic);
    if(p.todo)l=l.filter(c=>!U.revised[c.id]);
    if(p.req&&info.syllabus)l=l.filter(c=>!c.optional);
  }
  l=l.filter(c=>matchQ(c,q));
  const sort=S.listTab==="new"?"date":(p.sort||"topic");
  if(sort==="year")l=l.slice().sort((a,b)=>(b.year||0)-(a.year||0));
  else if(sort==="az")l=l.slice().sort((a,b)=>a.name.localeCompare(b.name));
  else if(sort==="topic"&&info.landmark)l=l.slice().sort((a,b)=>info.group(a).localeCompare(info.group(b))||(a.year||0)-(b.year||0));
  return {l,sort};
}
function matchQ(c,q){
  if(!q)return true;
  const hay=(c._h||(c._h=[c.name,c.cite,c.tag,c.topic,(c.topics||[]).join(" "),c.subjects.join(" "),c.court,c.year,c.bench].join(" ").toLowerCase()))+" "+(U.mytags[c.id]||"").toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every(w=>hay.includes(w));
}
function renderPane(){
  const p=U.prefs;const info=colInfo(S.col);if(S.listTab==="library")U.prefs.lastCol=S.col;
  const isNew=S.listTab==="new";
  const topics=isNew?[]:[...new Set(info.list.map(c=>c.topic).filter(Boolean))];
  if(p.topicCol!==S.col){p.topic="";p.topicCol=S.col}
  const fresh=isNew&&p.prevSeen?news().filter(c=>(c.added||"")>p.prevSeen).length:0;
  const d=info.list.filter(c=>U.revised[c.id]).length;
  $("#pane").innerHTML=`
   <div class="pane-h">${isNew?"":`<a class="iconbtn" href="#library" aria-label="All subjects">${ico("back")}</a>`}<div style="min-width:0"><h1 class="h1" style="font-size:1.6rem">${esc(info.title)}</h1>
     <div class="sub">${isNew?`${info.list.length} judgments · newest first`:`${d} of ${info.list.length} revised`}</div></div>
     <button class="btn" id="study" style="margin-left:auto">${ico("rev")}Study</button></div>
   ${isNew?"":`<div class="bar"><i style="width:${info.list.length?d/info.list.length*100:0}%"></i></div>`}
   <div class="searchwrap">${ico("search")}<input class="search" id="q" type="search" placeholder="Filter this list…" value="${esc((isNew?p.qNew:p.qLib)||"")}" aria-label="Filter"></div>
   ${isNew?`<div class="seg" role="group" aria-label="Court">${[["all","All courts"],["sc","Supreme Court"],["hc","High Courts"]].map(([k,l])=>`<button data-court="${k}" aria-pressed="${(p.court||"all")===k}">${l}</button>`).join("")}</div>
     <div class="chips"><button class="chip" data-sn="" aria-pressed="${!p.subjNew}">All subjects</button>${subjects(news()).map(([s,n])=>`<button class="chip" data-sn="${esc(s)}" aria-pressed="${p.subjNew===s}">${esc(s)}<span class="n">${n}</span></button>`).join("")}</div>`
   :`${topics.length>1?`<div class="chips"><button class="chip" data-tp="" aria-pressed="${!p.topic}">All topics</button>${topics.map(t=>`<button class="chip" data-tp="${esc(t)}" aria-pressed="${p.topic===t}">${esc(t)}</button>`).join("")}</div>`:""}
     <div class="row"><button class="chip" id="f-todo" aria-pressed="${!!p.todo}">Not revised yet</button>${info.syllabus?`<button class="chip" id="f-req" aria-pressed="${!!p.req}">Required only</button>`:""}
       <select class="select" id="sort" aria-label="Sort" style="margin-left:auto;padding:6px 10px;font-size:.84rem"><option value="topic" ${(p.sort||"topic")==="topic"?"selected":""}>By topic</option><option value="year" ${p.sort==="year"?"selected":""}>Newest first</option><option value="az" ${p.sort==="az"?"selected":""}>A–Z</option></select>
       </div>`}
   ${fresh?`<div class="banner">${fresh} new since your last visit</div>`:""}
   <ul class="cards" id="list"></ul>`;
  const rer=()=>{S.limit=100;renderPane();if(window.innerWidth>860&&!S.caseId)renderCase(S.ids[0])};
  $("#q").oninput=e=>{if(isNew)p.qNew=e.target.value;else p.qLib=e.target.value;persist("prefs");S.limit=100;renderItems(info)};
  $$("#pane [data-court]").forEach(b=>b.onclick=()=>{p.court=b.dataset.court;persist("prefs");rer()});
  $$("#pane [data-sn]").forEach(b=>b.onclick=()=>{p.subjNew=b.dataset.sn;persist("prefs");rer()});
  $$("#pane [data-tp]").forEach(b=>b.onclick=()=>{p.topic=b.dataset.tp;persist("prefs");rer()});
  const ft=$("#f-todo");if(ft)ft.onclick=()=>{p.todo=!p.todo;persist("prefs");rer()};
  const fr=$("#f-req");if(fr)fr.onclick=()=>{p.req=!p.req;persist("prefs");rer()};
  const so=$("#sort");if(so)so.onchange=e=>{p.sort=e.target.value;persist("prefs");rer()};
  const sb=$("#study");if(sb)sb.onclick=()=>{U.prefs.deck=isNew?"new":"col:"+S.col;U.prefs.rmode="cards";persist("prefs");location.hash="revise"};
  renderItems(info);
  const ac=$(`#pane .chip[aria-pressed="true"]`);if(ac&&ac.dataset.tp)ac.scrollIntoView({block:"nearest",inline:"center"});
}
function renderItems(info){
  const {l,sort}=filtered(info);S.ids=l.map(c=>c.id);
  let html="",last="";const grouped=S.listTab==="new"||sort==="topic";
  for(const c of l.slice(0,S.limit)){
    if(grouped){const g=info.group(c);if(g!==last){html+=`<li class="grp">${esc(g)}</li>`;last=g}}
    html+=itemHTML(c);
  }
  if(l.length>S.limit)html+=`<li><button class="more" id="more">Show more (${l.length-S.limit} left)</button></li>`;
  $("#list").innerHTML=html||`<li class="empty">${S.col==="saved"?"Nothing saved yet. Tap the ☆ on any case to keep it here.":"No cases match. Clear the filter or try fewer words."}</li>`;
  const m=$("#more");if(m)m.onclick=()=>{S.limit+=150;renderItems(info)};
  wireItems($("#list"));
}
function itemHTML(c){
  const k=courtKind(c);const t=tagOf(c);
  const meta=c.kind==="new"?`<span class="tag ${k}">${esc(shortCourt(c.court))}</span><span>${esc(c.subjects[0])}</span>`
    :c.kind==="syllabus"?`<span>${esc(c.course)}</span>${c.year?`<span class="mono">${esc(c.year)}</span>`:""}${c.optional?'<span class="tag mod">Optional</span>':""}`
    :`${c.cite?`<span class="mono">${esc(c.cite)}</span>`:c.year?`<span class="mono">${esc(c.year)}</span>`:""}`;
  return `<li><a class="card item ${k}" href="#case/${encodeURIComponent(c.id)}" aria-current="${c.id===S.caseId}">
    <span class="nm">${esc(c.name)}</span>
    <button class="star" data-star="${esc(c.id)}" aria-pressed="${!!U.saved[c.id]}" aria-label="${U.saved[c.id]?"Remove from saved":"Save"}">${U.saved[c.id]?"★":"☆"}</button>
    <span class="meta">${meta}${U.revised[c.id]?'<span class="row" style="gap:4px;color:var(--good)"><span class="dot"></span>Revised</span>':""}</span>
    <span class="p">${t?esc(t):"<em>No summary yet — add yours</em>"}</span></a></li>`;
}
function wireItems(root){
  root.querySelectorAll("[data-star]").forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();const id=b.dataset.star;toggleSave(id);
    b.setAttribute("aria-pressed",!!U.saved[id]);b.textContent=U.saved[id]?"★":"☆";toast(U.saved[id]?"Saved":"Removed from saved");if(S.caseId===id)renderCase()});
}

/* ---------------- case sheet ---------------- */
function renderCase(forceId){
  const id=forceId||S.caseId;const c=id&&byId(id);
  if(!c){$("#detail").innerHTML=forceId===undefined&&!S.caseId?`<div class="empty">Pick a case from the list.</div>`:`<div class="empty">This case isn't available.</div>`;return}
  if(S.caseId){U.recent=[id,...U.recent.filter(x=>x!==id)].slice(0,12);persist("recent")}
  const n=c.notes||(c.kind==="custom"?c:null);const tag=tagOf(c);const b=U.briefs[id]||{};const st=n&&STATUS[n.status];
  const k=courtKind(c);
  const kanoon="https://indiankanoon.org/search/?formInput="+encodeURIComponent(c.name.replace(/\(.*?\)/g,"").trim());
  const i=S.ids.indexOf(id);const prev=i>0?byId(S.ids[i-1]):null,next=i>=0&&i<S.ids.length-1?byId(S.ids[i+1]):null;
  const F=[["F","facts","Facts in your words"],["I","issue","The legal question"],["R","rule","Rule / ratio"],["A","analysis","How the court reasoned"],["C","conclusion","Outcome and why it matters"]];
  const crumbs=c.kind==="new"?`<span class="tag ${k}">${esc(shortCourt(c.court))}</span><span class="tag">${esc(dateLabel(c))}</span>${c.subjects.map(s=>`<span class="tag">${esc(s)}</span>`).join("")}`
    :c.kind==="syllabus"?`<span class="tag">${esc(c.course)}</span>${(c.topics||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join("")}${c.optional?'<span class="tag mod">Optional</span>':""}`
    :c.kind==="custom"?'<span class="tag">Added by you</span>':`<span class="tag lm">${esc(c.subjects.join(", "))}</span>${c.topic?`<span class="tag">${esc(c.topic)}</span>`:""}`;
  const srs=U.srs[id];
  $("#detail").innerHTML=`
   <a class="link back" href="#${S.listTab==="new"?"new":"library/"+encodeURIComponent(S.col||"lm:all")}" style="display:inline-flex;align-items:center;gap:4px;margin-bottom:12px">${ico("back")} ${S.listTab==="new"?"New judgments":esc(colInfo(S.col).title)}</a>
   <div class="crumb">${crumbs}${st?`<span class="tag ${st[0]}">${st[1]}</span>`:""}</div>
   <h1>${esc(c.name)}</h1>
   <div class="citeline">${esc(c.cite||"Citation not available")}${c.cite?' <button class="copy" id="copy">Copy</button>':""}</div>
   <div class="facts">${[c.court&&c.kind!=="new"?c.court:"",c.bench,c.kind!=="new"&&c.year?String(c.year):""].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join("")}${srs?`<span>Next review ${srs.due<=today()?"today":new Date(srs.due+"T00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span>`:""}</div>
   <div class="actionbar">
     <button class="btn ${U.revised[id]?"on":""}" id="rev">${ico("check")}${U.revised[id]?"Revised":(window.innerWidth<=860?"Revised?":"Mark revised")}</button>
     <button class="btn ${U.saved[id]?"on":""}" id="save">${ico("star")}${U.saved[id]?"Saved":"Save"}</button>
     ${(tag||n)?`<button class="btn ${S.recall?"on":""}" id="recall">${ico("eye")}${S.recall?"Recall on":"Recall"}</button>`:""}
     ${srs?"":`<button class="btn" id="addsrs">${ico("rev")}Flashcard</button>`}
   </div>
   <div class="${S.recall?"recall":""}">
     ${tag?`<div class="principle hide" id="pr"><div class="label">${c.kind==="new"?"What the court held":"Principle"}</div><p class="body">${esc(tag)}</p></div>`
       :(n?"":`<div class="nosum">No summary yet. Read the judgment, then write the principle in one line under “My notes”. It will show in your lists and flashcards.</div>`)}
     ${n&&n.facts?`<div class="blk"><h2 class="label">Facts</h2><p>${esc(n.facts)}</p></div>`:""}
     ${n&&n.issues&&n.issues.length?`<div class="blk"><h2 class="label">Issues</h2><ol>${n.issues.map(x=>`<li>${esc(x)}</li>`).join("")}</ol></div>`:""}
     ${n&&n.held?`<div class="blk hide"><h2 class="label">Held</h2><p class="body">${esc(n.held)}</p></div>`:""}
     ${n&&n.ratio&&n.ratio!==tag?`<div class="blk hide"><h2 class="label">Ratio decidendi</h2><p class="body" style="font-family:var(--display);font-size:1.1rem">${esc(n.ratio)}</p></div>`:""}
     ${n&&n.matters?`<div class="blk"><h2 class="label">Why it matters</h2><p>${esc(n.matters)}</p></div>`:""}
     ${n&&n.history?`<div class="blk"><h2 class="label">Later history and new codes</h2><p class="statute">${esc(n.history)}</p></div>`:""}
   </div>
   <div class="links">
     ${c.link?`<a class="btn" href="${esc(c.link)}" target="_blank" rel="noopener">${ico("ext")}Open on LMS</a>`:""}
     ${c.source?`<a class="btn" href="${esc(c.source)}" target="_blank" rel="noopener">${ico("ext")}Read report</a>`:""}
     <a class="btn" href="${kanoon}" target="_blank" rel="noopener">${ico("search")}Find judgment</a>
     ${navigator.share?`<button class="btn" id="share">${ico("share")}Share</button>`:""}
   </div>
   <details class="fold" ${Object.keys(b).length||U.mytags[id]?"open":""}><summary>My notes</summary><div class="in">
     ${c.kind==="custom"?"":`<label class="field" for="mytag">${c.tag?"The principle in your own words":"Principle in one line"}<input id="mytag" value="${esc(U.mytags[id]||"")}" placeholder="${c.tag?"Rewriting it helps you remember":"e.g. Pledge needs delivery of the goods"}"></label>`}
     ${F.map(([kk,f,l])=>`<label class="field" for="b-${f}"><span><b>${kk}</b>${l}</span><textarea id="b-${f}" data-f="${f}" rows="${f==="analysis"?4:2}">${esc(b[f]||"")}</textarea></label>`).join("")}
     <div class="saved" id="savedmsg">Saved on this device as you type.</div></div></details>
   <p class="src">${c.kind==="new"?"Summary written from published court reporting. Read the judgment before relying on it.":c.kind==="syllabus"?"From your course reading list. The LMS link needs you to be signed in.":"Principles are short study aids. Check them against the judgment."}</p>
   ${(prev||next)?`<nav class="pager" aria-label="Next and previous case">${prev?`<a href="#case/${encodeURIComponent(prev.id)}">← Previous<b>${esc(prev.name)}</b></a>`:""}${next?`<a class="nx" href="#case/${encodeURIComponent(next.id)}">Next →<b>${esc(next.name)}</b></a>`:""}</nav>`:""}
   <div class="reading-pad"></div>`;
  const cp=$("#copy");if(cp)cp.onclick=()=>navigator.clipboard.writeText(c.cite).then(()=>toast("Citation copied")).catch(()=>toast("Copy blocked. Select the citation instead."));
  $("#rev").onclick=()=>{setRevised(id,!U.revised[id]);toast(U.revised[id]?"Marked revised":"Unmarked");renderCase(forceId);refreshList()};
  $("#save").onclick=()=>{toggleSave(id);toast(U.saved[id]?"Saved":"Removed from saved");renderCase(forceId);refreshList()};
  const rc=$("#recall");if(rc)rc.onclick=()=>{S.recall=!S.recall;renderCase(forceId)};
  const as=$("#addsrs");if(as)as.onclick=()=>{U.srs[id]={box:0,due:today()};persist("srs");badges();toast("Added to today's flashcards");renderCase(forceId)};
  $$("#detail .hide").forEach(h=>h.onclick=()=>{if(S.recall)h.classList.add("shown")});
  const sh=$("#share");if(sh)sh.onclick=()=>navigator.share({title:c.name,text:`${c.name}${c.cite?" "+c.cite:""}${tag?" — "+tag:""}`,url:location.origin+location.pathname+"#case/"+encodeURIComponent(id)}).catch(()=>{});
  const mt=$("#mytag");if(mt){let t;mt.oninput=()=>{clearTimeout(t);t=setTimeout(()=>{const v=mt.value.trim();if(v)U.mytags[id]=v;else delete U.mytags[id];persist("mytags");$("#savedmsg").textContent="Saved";refreshList()},500)}}
  let t2;$$("#detail textarea").forEach(ta=>ta.oninput=()=>{U.briefs[id]=U.briefs[id]||{};U.briefs[id][ta.dataset.f]=ta.value;if(!ta.value)delete U.briefs[id][ta.dataset.f];if(!Object.keys(U.briefs[id]).length)delete U.briefs[id];clearTimeout(t2);t2=setTimeout(()=>{persist("briefs");$("#savedmsg").textContent="Saved"},400)});
}
function refreshList(){if(!$("#v-list").hidden&&$("#list")){const y=$("#list").scrollTop;renderItems(colInfo(S.col));$("#list").scrollTop=y}}

/* ---------------- revise: flashcards + quiz ---------------- */
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const INTERVALS=[0,1,3,7,16,35,80];
function deckOptions(){
  const o=[["due","Due today ("+dueIds().length+")"],["lm:all","All landmark cases"],["new","New judgments"],["saved","Saved cases"]];
  subjects(landmarks()).forEach(([s])=>o.push(["lm:"+s,"Landmark · "+s]));
  courses().forEach(c=>o.push(["course:"+c,"Syllabus · "+c]));
  const cur=U.prefs.deck;if(cur&&cur.startsWith("col:")&&!o.some(x=>x[0]===cur.slice(4)))o.push([cur.slice(4),colInfo(cur.slice(4)).title]);
  return o;
}
function deckPool(key){
  if(key==="due")return dueIds().map(byId);
  if(key==="new"){const o=S.listTab;S.listTab="new";const l=colInfo(null).list;S.listTab=o;return l}
  const o=S.listTab;S.listTab="library";const l=colInfo(key).list;S.listTab=o;return l;
}
const R={mode:"cards",queue:[],i:0,flipped:false,done:0,reverse:false,quiz:null};
function renderRevise(){
  let deck=U.prefs.deck||(dueIds().length?"due":"lm:all");if(deck.startsWith("col:"))deck=deck.slice(4);U.prefs.deck=deck;persist("prefs");
  R.mode=U.prefs.rmode||"cards";R.reverse=!!U.prefs.reverse;
  $("#v-revise").innerHTML=`<div class="narrow">
    <div class="hello"><div><h1 class="h1">Revise</h1><p class="sub">${dueIds().length} due today · ${streak()} day streak</p></div></div>
    <div class="seg" style="margin-top:14px" role="group" aria-label="Mode">${[["cards","Flashcards"],["quiz","Quiz"]].map(([k,l])=>`<button data-mode="${k}" aria-pressed="${R.mode===k}">${l}</button>`).join("")}</div>
    <div class="row" style="margin-top:10px"><select class="select" id="deck" aria-label="Deck" style="flex:1">${deckOptions().map(([k,l])=>`<option value="${esc(k)}" ${k===deck?"selected":""}>${esc(l)}</option>`).join("")}</select>
      ${R.mode==="cards"?`<button class="chip" id="rev-dir" aria-pressed="${R.reverse}" title="Show the principle first">Principle → case</button>`:""}</div>
    <div id="rbody"></div></div>`;
  $$("#v-revise [data-mode]").forEach(b=>b.onclick=()=>{U.prefs.rmode=b.dataset.mode;persist("prefs");renderRevise()});
  $("#deck").onchange=e=>{U.prefs.deck=e.target.value;persist("prefs");renderRevise()};
  const rd=$("#rev-dir");if(rd)rd.onclick=()=>{U.prefs.reverse=!U.prefs.reverse;persist("prefs");renderRevise()};
  if(R.mode==="cards")startCards(deck);else newQuiz(deck);
}
function startCards(deck){
  let pool=deckPool(deck).filter(c=>tagOf(c));
  if(deck!=="due"){const t=today();const due=pool.filter(c=>U.srs[c.id]&&U.srs[c.id].due<=t);const fresh=shuffle(pool.filter(c=>!U.srs[c.id])).slice(0,20);pool=due.concat(fresh)}
  R.queue=shuffle(pool).map(c=>c.id);R.i=0;R.done=0;R.flipped=false;renderCard(deck);
}
function renderCard(deck){
  const body=$("#rbody");
  if(!R.queue.length){body.innerHTML=`<div class="card pad empty" style="margin-top:14px">${deck==="due"?"Nothing due right now. Pick a subject above to learn new cards.":"No cards with a principle in this set yet."}</div>`;return}
  if(R.i>=R.queue.length){markDay();badges();body.innerHTML=`<div class="card pad" style="margin-top:14px;text-align:center"><p class="label">Session done</p><p class="score">${R.done}</p><p class="sub">cards reviewed · ${dueIds().length} still due today</p><div class="row" style="justify-content:center;margin-top:14px"><button class="btn primary" id="again">Another round</button><a class="btn" href="#home">Home</a></div></div>`;$("#again").onclick=()=>startCards(deck);return}
  const c=byId(R.queue[R.i]);const tag=tagOf(c);const s=U.srs[c.id]||{box:0};
  const front=R.reverse?`<div class="back">${esc(tag)}</div>`:`<div class="front">${esc(c.name)}</div><div class="mono" style="color:var(--muted)">${esc(c.cite||c.year||"")}</div>`;
  const back=R.reverse?`<div class="front">${esc(c.name)}</div><div class="mono" style="color:var(--muted)">${esc(c.cite||c.year||"")}</div>`:`<div class="back">${esc(tag)}</div>`;
  const nxt=b=>{const d=INTERVALS[Math.min(b,INTERVALS.length-1)];return d===0?"today":d===1?"1 day":d+" days"};
  body.innerHTML=`<div class="progressline"><span class="mono">${R.i+1} / ${R.queue.length}</span><span class="bar"><i style="width:${R.i/R.queue.length*100}%"></i></span></div>
   <div class="card flash" id="flash" tabindex="0" role="button" aria-label="Flip card">
     <span class="tag ${courtKind(c)}" style="align-self:center">${esc(c.kind==="syllabus"?c.course:c.subjects[0])}</span>${front}
     ${R.flipped?`<hr style="border:0;border-top:1px dashed var(--line);width:100%;margin:8px 0">${back}`:`<div class="hint">${R.reverse?"Which case is this? Tap to check":"What did it hold? Tap to check"}</div>`}</div>
   ${R.flipped?`<div class="grades">
     <button class="again" data-g="0">Again<small>today</small></button><button data-g="1">Hard<small>${nxt(Math.max(1,s.box))}</small></button>
     <button class="good" data-g="2">Good<small>${nxt(s.box+1)}</small></button><button data-g="3">Easy<small>${nxt(s.box+2)}</small></button></div>`
   :`<button class="btn primary" id="flip" style="width:100%;margin-top:12px">Show answer</button>`}
   <div class="row" style="justify-content:center;margin-top:10px"><a class="link" href="#case/${encodeURIComponent(c.id)}">Open full case</a></div>`;
  const flip=()=>{if(!R.flipped){R.flipped=true;renderCard(deck)}};
  $("#flash").onclick=flip;$("#flash").onkeydown=e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();flip()}};
  const f=$("#flip");if(f)f.onclick=flip;
  $$("#rbody [data-g]").forEach(b=>b.onclick=()=>grade(c.id,+b.dataset.g,deck));
}
function grade(id,g,deck){
  const s=U.srs[id]||{box:0};
  if(g===0){s.box=0;s.due=today();R.queue.push(id)}
  else{s.box=g===1?Math.max(1,s.box):s.box+(g===2?1:2);s.due=addDays(today(),INTERVALS[Math.min(s.box,INTERVALS.length-1)]);if(g>=2)setRevised(id,true)}
  s.last=today();U.srs[id]=s;persist("srs");markDay();R.done++;R.i++;R.flipped=false;badges();renderCard(deck);
}
function newQuiz(deck){
  const pool=deckPool(deck);const tagged=pool.filter(c=>tagOf(c));
  const body=$("#rbody");
  if(pool.length<4){body.innerHTML=`<div class="card pad empty" style="margin-top:14px">Not enough cases in this set for a quiz. Pick a bigger set above.</div>`;return}
  const topics=[...new Set(pool.map(x=>x.topic).filter(Boolean))];
  R.quiz={deck,i:0,score:0,qs:shuffle(pool).slice(0,10).map(c=>{
    const types=[];if(tagOf(c)&&tagged.length>=4)types.push("ratio","tag");if(c.topic&&topics.length>=4)types.push("topic");if(c.cite)types.push("cite");if(!types.length)types.push("topic");
    const ty=types[Math.floor(Math.random()*types.length)];
    if(ty==="tag")return{c,prompt:"Which principle comes from this case?",text:c.name,opts:shuffle([c,...shuffle(tagged.filter(x=>x.id!==c.id&&tagOf(x)!==tagOf(c))).slice(0,3)]).map(x=>({ok:x.id===c.id,label:tagOf(x)}))};
    if(ty==="topic")return{c,prompt:"Which topic is this case about?",text:c.name,opts:shuffle([c.topic,...shuffle(topics.filter(t=>t!==c.topic)).slice(0,3)]).map(t=>({ok:t===c.topic,label:t}))};
    if(ty==="cite")return{c,prompt:"Which case is reported at",text:c.cite,opts:shuffle([c,...shuffle(pool.filter(x=>x.id!==c.id)).slice(0,3)]).map(x=>({ok:x.id===c.id,label:x.name}))};
    return{c,prompt:"Which case laid this down?",text:tagOf(c),opts:shuffle([c,...shuffle(tagged.filter(x=>x.id!==c.id)).slice(0,3)]).map(x=>({ok:x.id===c.id,label:x.name}))};
  })};
  renderQ();
}
function renderQ(){
  const Q=R.quiz;const body=$("#rbody");
  if(Q.i>=Q.qs.length){markDay();body.innerHTML=`<div class="card pad" style="margin-top:14px;text-align:center"><p class="label">Round complete</p><p class="score">${Q.score}/${Q.qs.length}</p><p class="sub">${Q.score===Q.qs.length?"Every answer right.":"Missed ones were added to your flashcards."}</p><div class="row" style="justify-content:center;margin-top:14px"><button class="btn primary" id="again">Another round</button></div></div>`;$("#again").onclick=()=>newQuiz(Q.deck);badges();return}
  const q=Q.qs[Q.i];let done=false;
  body.innerHTML=`<div class="progressline"><span class="mono">${Q.i+1} / ${Q.qs.length}</span><span class="bar"><i style="width:${Q.i/Q.qs.length*100}%"></i></span><span class="mono">Score ${Q.score}</span></div>
   <div class="card pad" style="margin-top:12px"><div class="label">${esc(q.prompt)}</div><div class="qtext">${esc(q.text)}</div>
   <div class="opts">${q.opts.map((o,i)=>`<button class="opt" data-i="${i}">${esc(o.label)}</button>`).join("")}</div><div id="qx"></div></div>`;
  $$("#rbody .opt").forEach(b=>b.onclick=()=>{
    if(done)return;done=true;const o=q.opts[+b.dataset.i];if(o.ok)Q.score++;else if(tagOf(q.c)){U.srs[q.c.id]={...(U.srs[q.c.id]||{}),box:0,due:today()};persist("srs")}
    $$("#rbody .opt").forEach(x=>{x.disabled=true;const oo=q.opts[+x.dataset.i];if(oo.ok)x.classList.add("right");else if(x===b)x.classList.add("wrong")});
    const t=tagOf(q.c);
    $("#qx").innerHTML=`<div class="explain"><strong>${o.ok?"Correct.":"Not this one."}</strong> ${esc(q.c.name)}${q.c.cite?", "+esc(q.c.cite):""}${t?". "+esc(t)+".":""}</div>
     <div class="row" style="justify-content:flex-end;margin-top:12px"><a class="btn" href="#case/${encodeURIComponent(q.c.id)}">Open case</a><button class="btn primary" id="qnext">${Q.i+1<Q.qs.length?"Next":"See score"}</button></div>`;
    $("#qnext").onclick=()=>{Q.i++;renderQ()};$("#qnext").focus();
  });
}

/* ---------------- me ---------------- */
let installEvt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvt=e;if(S.tab==="me")renderMe()});
function renderMe(){
  const standalone=matchMedia("(display-mode: standalone)").matches||navigator.standalone;
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  const theme=store.get("theme","");
  const lm=landmarks();
  $("#v-me").innerHTML=`<div class="narrow">
   <h1 class="h1">Me</h1>
   <div class="stats">
     <div class="card stat"><b>${Object.keys(U.revised).length}</b><span>revised</span></div>
     <div class="card stat"><b>${streak()}</b><span>day streak</span></div>
     <div class="card stat"><b>${Object.keys(U.briefs).length}</b><span>briefs written</span></div></div>
   <div class="sec-h"><h2 class="h2">Progress by subject</h2></div>
   <div class="card pad"><div class="subjbars">${subjects(lm).map(([s,n])=>{const d=lm.filter(c=>c.subjects.includes(s)&&U.revised[c.id]).length;const [fg]=hue(s);return `<a class="r" href="#library/${encodeURIComponent("lm:"+s)}" style="text-decoration:none"><span>${esc(s)}</span><span class="mono" style="color:var(--muted)">${d}/${n}</span><span class="bar"><i style="width:${d/n*100}%;background:${fg}"></i></span></a>`}).join("")}</div></div>
   ${standalone?"":`<div class="sec-h"><h2 class="h2">Install on your phone</h2></div><div class="card pad">
     ${installEvt?`<p class="sub" style="margin:0 0 12px">Puts Ratio on your home screen. It opens full-screen and works offline.</p><button class="btn primary" id="install">Install Ratio</button>`
     :ios?`<ol class="steps"><li>Open this page in <b>Safari</b>.</li><li>Tap <b>Share</b>.</li><li>Tap <b>Add to Home Screen</b>, then <b>Add</b>.</li></ol>`
     :`<ol class="steps"><li>Open this page in <b>Chrome</b>.</li><li>Tap the <b>⋮</b> menu.</li><li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li></ol>`}</div>`}
   <div class="sec-h"><h2 class="h2">Appearance</h2></div>
   <div class="seg" role="group" aria-label="Theme">${[["","System"],["light","Light"],["dark","Dark"]].map(([k,l])=>`<button data-theme-set="${k}" aria-pressed="${theme===k}">${l}</button>`).join("")}</div>
   <div class="sec-h"><h2 class="h2">Add a case</h2></div>
   <div class="card pad"><form class="form" id="addform">
       <label class="field full">Case name<input id="a-name" required placeholder="Olga Tellis v. Bombay Municipal Corporation"></label>
       <label class="field">Citation<input id="a-cite" placeholder="(1985) 3 SCC 545"></label>
       <label class="field">Year<input id="a-year" type="number" min="1800" max="2100" inputmode="numeric"></label>
       <label class="field">Subject<input id="a-subj" placeholder="Constitutional Law" list="subjlist"></label>
       <label class="field">Topic<input id="a-topic" placeholder="Article 21"></label>
       <label class="field full">Principle in one line<input id="a-tag" required></label>
       <label class="field full">Facts<textarea id="a-facts" rows="3"></textarea></label>
       <label class="field full">Held<textarea id="a-held" rows="3"></textarea></label>
       <div class="full row" style="justify-content:flex-end"><button class="btn primary" type="submit">Save case</button></div>
     </form><datalist id="subjlist">${subjects(DB.cases).map(([s])=>`<option>${esc(s)}</option>`).join("")}</datalist>
     ${U.custom.length?`<p class="sub" style="margin-top:14px"><a class="link" href="#library/custom">See your ${U.custom.length} added case${U.custom.length>1?"s":""} →</a></p>`:""}</div>
   <div class="sec-h"><h2 class="h2">Back up your notes</h2></div>
   <div class="card pad"><p class="sub" style="margin:0 0 12px">Notes, saved cases, flashcard progress and streak live on this device. Download a backup before changing phones and restore it on the new one.</p>
     <div class="row"><button class="btn" id="export">Download backup</button><label class="btn" for="import">Restore backup</label><input id="import" type="file" accept="application/json" hidden></div></div>
   <div class="sec-h"><h2 class="h2">About the cases</h2></div>
   <div class="card pad"><p class="sub" style="margin:0">${DB.cases.length+DB.syllabus.length} cases. New Supreme Court and High Court judgments are added every morning from published court reporting. Principles are short study aids in plain words, not headnotes. Read the judgment before citing it.${DB.updated?` Last update ${new Date(DB.updated).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}.`:""}</p></div>
  </div>`;
  const ib=$("#install");if(ib)ib.onclick=async()=>{installEvt.prompt();await installEvt.userChoice;installEvt=null;renderMe()};
  $$("[data-theme-set]").forEach(b=>b.onclick=()=>{const v=b.dataset.themeSet;store.set("theme",v);if(v)document.documentElement.dataset.theme=v;else delete document.documentElement.dataset.theme;renderMe()});
  $("#addform").onsubmit=e=>{e.preventDefault();const v=i=>$("#"+i).value.trim();
    U.custom.push({id:"u"+Date.now(),name:v("a-name"),cite:v("a-cite"),year:+v("a-year")||"",subjects:[v("a-subj")||"My cases"],topic:v("a-topic")||"My cases",tag:v("a-tag"),facts:v("a-facts"),held:v("a-held"),issues:[]});
    persist("custom");toast("Case saved");renderMe()};
  $("#export").onclick=()=>{const data={app:"ratio",v:2,exported:new Date().toISOString()};KEYS.forEach(k=>data[k]=U[k]);
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:"application/json"}));a.download="ratio-backup-"+today()+".json";document.body.appendChild(a);a.click();a.remove();toast("Backup downloaded")};
  $("#import").onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{const d=JSON.parse(t);if(d.app!=="ratio")throw 0;
    KEYS.forEach(k=>{if(d[k]==null)return;if(Array.isArray(U[k]))U[k]=k==="custom"?[...U[k].filter(x=>!d[k].some(y=>y.id===x.id)),...d[k]]:[...new Set([...U[k],...d[k]])];else U[k]={...U[k],...d[k]};persist(k)});
    toast("Backup restored");badges();renderMe()}).catch(()=>toast("That file isn't a Ratio backup."))};
}

/* ---------------- global search ---------------- */
function openSearch(){$("#search").hidden=false;document.body.style.overflow="hidden";const q=$("#gq");q.value="";renderSearch();setTimeout(()=>q.focus(),30)}
function closeSearch(){$("#search").hidden=true;document.body.style.overflow=""}
function renderSearch(){
  const q=$("#gq").value.trim();const r=$("#gresults");
  if(q.length<2){const rec=U.recent.map(byId).filter(Boolean).slice(0,8);r.innerHTML=rec.length?`<div class="cards" style="max-width:760px;margin:0 auto"><div class="grp">Recently opened</div><ul class="cards">${rec.map(itemHTML).join("")}</ul></div>`:`<div class="empty">Type a case name, citation, section or principle.<br>Try “Article 21”, “bail”, “(2017) 10 SCC” or “frustration”.</div>`;wireItems(r);return}
  const hits=all().filter(c=>matchQ(c,q));
  const nameHit=c=>c.name.toLowerCase().includes(q.toLowerCase())?0:1;
  hits.sort((a,b)=>nameHit(a)-nameHit(b)||(a.kind==="syllabus")-(b.kind==="syllabus"));
  r.innerHTML=hits.length?`<ul class="cards"><li class="grp">${hits.length} result${hits.length>1?"s":""}</li>${hits.slice(0,80).map(itemHTML).join("")}</ul>`:`<div class="empty">No cases match “${esc(q)}”.</div>`;
  wireItems(r);
}
$("#opensearch").onclick=openSearch;$("#closesearch").onclick=closeSearch;
$("#gq").oninput=renderSearch;
$("#gresults").addEventListener("click",e=>{const a=e.target.closest("a.item");if(a){const c=byId(decodeURIComponent(a.getAttribute("href").slice(6)));if(c){S.listTab=c.kind==="new"?"new":"library";if(c.kind!=="new")S.col=c.kind==="syllabus"?"course:"+c.course:c.kind==="custom"?"custom":"lm:"+c.subjects[0]}closeSearch()}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#search").hidden)closeSearch();if(e.key==="/"&&$("#search").hidden&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();openSearch()}});
document.addEventListener("click",e=>{const a=e.target.closest("#v-home a.item, #v-home a.mini");if(!a)return;const c=byId(decodeURIComponent(a.getAttribute("href").slice(6)));if(c){S.listTab=c.kind==="new"?"new":"library";if(c.kind!=="new")S.col=c.kind==="syllabus"?"course:"+c.course:c.kind==="custom"?"custom":"lm:"+c.subjects[0]}},true);

/* ---------------- start ---------------- */
if("serviceWorker" in navigator&&location.protocol==="https:")navigator.serviceWorker.register("sw.js").catch(()=>{});
const p0=U.prefs;if(p0.lastSeen&&p0.prevSeen!==p0.lastSeen){p0.prevSeen=p0.lastSeen;persist("prefs")}
load();
})();
