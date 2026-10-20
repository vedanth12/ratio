/* Ratio — case study app. Data: data/cases.json (landmark + new judgments), data/syllabus.json (course reading lists).
   Everything the student writes stays in this browser (localStorage). */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const store={get(k,d){try{const v=localStorage.getItem("ratio2."+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem("ratio2."+k,JSON.stringify(v))}catch(e){}}};
const U={revised:store.get("revised",{}),saved:store.get("saved",{}),briefs:store.get("briefs",{}),mytags:store.get("mytags",{}),custom:store.get("custom",[]),prefs:store.get("prefs",{})};
const persist=k=>store.set(k,U[k]);
const STATUS={good:["good","Good law"],bad:["bad","Overruled"],mod:["mod","Modified or codified"]};
let DB={cases:[],syllabus:[],updated:null,school:""};
let state={tab:"new",caseId:null,recall:false,limit:120};
const toast=t=>{const el=$("#toast");el.textContent=t;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),2000)};

/* ---------- data ---------- */
async function getJSON(u){const r=await fetch(u,{cache:"no-cache"});if(!r.ok)throw new Error(u+" "+r.status);return r.json()}
async function load(){
  try{
    const [c,s]=await Promise.all([getJSON("data/cases.json"),getJSON("data/syllabus.json").catch(()=>({cases:[]}))]);
    DB.cases=c.cases.map(x=>({...x,group:x.kind}));DB.updated=c.updated;
    DB.syllabus=(s.cases||[]).map(x=>({...x,kind:"syllabus",subjects:[x.course],topic:x.topics[0]}));DB.school=s.school||"";
  }catch(e){
    $("#updated").textContent="Couldn't load cases. Check your connection and reopen.";return;
  }
  const d=DB.updated?new Date(DB.updated):null;
  $("#updated").textContent=d?`Updated ${d.toLocaleDateString("en-IN",{day:"numeric",month:"short"})} · ${DB.cases.length+DB.syllabus.length} cases`:"";
  const lastSeen=U.prefs.lastSeen||"";
  const fresh=DB.cases.filter(c=>c.kind==="new"&&(c.added||"")>lastSeen).length;
  if(lastSeen&&fresh){const b=$("#badge");b.textContent=fresh;b.hidden=false}
  route();
}
const custom=()=>U.custom.map(c=>({...c,kind:"custom"}));
const all=()=>DB.cases.concat(DB.syllabus,custom());
const byId=id=>all().find(c=>c.id===id);
const tagOf=c=>U.mytags[c.id]||c.tag||"";
const subjectsOf=list=>[...new Set(list.flatMap(c=>c.subjects))].sort();
const dateLabel=c=>c.reported||(c.date?new Date(c.date+"T00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):String(c.year||""));

/* ---------- routing ---------- */
window.addEventListener("hashchange",route);
function route(){
  const h=decodeURIComponent(location.hash.slice(1))||"new";
  if(h.startsWith("case/")){state.caseId=h.slice(5);if(!["new","library"].includes(state.tab))state.tab="library";}
  else{state.caseId=null;state.tab=["new","library","quiz","me"].includes(h)?h:"new";state.limit=120}
  document.querySelectorAll("[data-tab]").forEach(a=>a.setAttribute("aria-current",a.dataset.tab===state.tab?"page":"false"));
  $("#v-list").hidden=!["new","library"].includes(state.tab);$("#v-quiz").hidden=state.tab!=="quiz";$("#v-me").hidden=state.tab!=="me";
  if(state.tab==="new"){U.prefs.lastSeen=new Date().toISOString().slice(0,10);persist("prefs");$("#badge").hidden=true}
  if(state.tab==="quiz")renderQuizPage();
  else if(state.tab==="me")renderMe();
  else{renderControls();renderList();if(state.caseId||window.innerWidth<=820)renderDetail()}
  $("#v-list").classList.toggle("reading",!!state.caseId);
  if(state.caseId)window.scrollTo({top:0});
}

/* ---------- list views ---------- */
function collectionOptions(){
  const o=[["landmark","Landmark cases"],["saved","Saved"]];
  const courses=[...new Set(DB.syllabus.map(c=>c.course))];
  courses.forEach(c=>o.push(["course:"+c,(DB.school?"Syllabus · ":"")+c]));
  if(U.custom.length)o.push(["custom","My added cases"]);
  return o;
}
function renderControls(){
  const p=U.prefs;
  if(state.tab==="new"){
    const courts=[["all","All courts"],["sc","Supreme Court"],["hc","High Courts"]];
    $("#controls").innerHTML=`<input class="search" id="q" type="search" placeholder="Search new judgments…" aria-label="Search" value="${esc(p.qNew||"")}">
     <div class="chips">${courts.map(([k,l])=>`<button class="chip" data-court="${k}" aria-pressed="${(p.court||"all")===k}">${l}</button>`).join("")}</div>
     <select class="select" id="subj" aria-label="Subject"><option value="">All subjects</option>${subjectsOf(DB.cases.filter(c=>c.kind==="new")).map(s=>`<option ${p.subjNew===s?"selected":""}>${esc(s)}</option>`).join("")}</select>
     <div class="meta-line" id="metaline"></div>`;
    $("#controls").querySelectorAll("[data-court]").forEach(b=>b.onclick=()=>{p.court=b.dataset.court;persist("prefs");renderControls();renderList()});
    $("#subj").onchange=e=>{p.subjNew=e.target.value;persist("prefs");renderList()};
    $("#q").oninput=e=>{p.qNew=e.target.value;persist("prefs");state.limit=120;renderList()};
  }else{
    const col=p.col||"landmark";const inCol=collection(col);
    $("#controls").innerHTML=`<select class="select" id="col" aria-label="Collection">${collectionOptions().map(([k,l])=>`<option value="${esc(k)}" ${k===col?"selected":""}>${esc(l)}</option>`).join("")}</select>
     <input class="search" id="q" type="search" placeholder="Search case, citation or principle…" aria-label="Search" value="${esc(p.qLib||"")}">
     ${col==="landmark"?`<div class="chips">${["All",...subjectsOf(inCol)].map(s=>`<button class="chip" data-s="${esc(s)}" aria-pressed="${(p.subj||"All")===s}">${esc(s)}</button>`).join("")}</div>`:""}
     <div class="chips"><button class="chip" id="f-todo" aria-pressed="${!!p.todo}">Not yet revised</button>${col.startsWith("course:")?`<button class="chip" id="f-req" aria-pressed="${!!p.req}">Required only</button>`:""}</div>
     <div class="meta-line"><span id="prog"></span><span class="bar"><i id="progbar"></i></span></div>`;
    $("#col").onchange=e=>{p.col=e.target.value;p.subj="All";persist("prefs");state.limit=120;renderControls();renderList()};
    $("#controls").querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{p.subj=b.dataset.s;persist("prefs");state.limit=120;renderControls();renderList()});
    $("#f-todo").onclick=()=>{p.todo=!p.todo;persist("prefs");renderControls();renderList()};
    const fr=$("#f-req");if(fr)fr.onclick=()=>{p.req=!p.req;persist("prefs");renderControls();renderList()};
    $("#q").oninput=e=>{p.qLib=e.target.value;persist("prefs");state.limit=120;renderList()};
  }
}
function collection(col){
  if(col==="saved")return all().filter(c=>U.saved[c.id]);
  if(col==="custom")return custom();
  if(col&&col.startsWith("course:"))return DB.syllabus.filter(c=>c.course===col.slice(7));
  return DB.cases.filter(c=>c.kind==="landmark");
}
function matchQ(c,q){
  if(!q)return true;
  const hay=[c.name,c.cite,tagOf(c),c.topic,(c.topics||[]).join(" "),c.subjects.join(" "),c.court,c.year,c.bench].join(" ").toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every(w=>hay.includes(w));
}
function currentList(){
  const p=U.prefs;
  if(state.tab==="new"){
    return DB.cases.filter(c=>c.kind==="new").filter(c=>{
      const court=p.court||"all";
      if(court==="sc"&&!/Supreme Court/.test(c.court))return false;
      if(court==="hc"&&!/High Court/.test(c.court))return false;
      if(p.subjNew&&!c.subjects.includes(p.subjNew))return false;
      return matchQ(c,p.qNew);
    });
  }
  const col=p.col||"landmark";
  let l=collection(col).filter(c=>matchQ(c,p.qLib));
  if(col==="landmark"&&p.subj&&p.subj!=="All")l=l.filter(c=>c.subjects.includes(p.subj));
  if(p.todo)l=l.filter(c=>!U.revised[c.id]);
  if(p.req&&col.startsWith("course:"))l=l.filter(c=>!c.optional);
  if(col==="landmark")l=l.slice().sort((a,b)=>a.subjects[0].localeCompare(b.subjects[0])||(a.topic||"").localeCompare(b.topic||"")||(a.year||0)-(b.year||0));
  return l;
}
function groupOf(c){
  if(state.tab==="new")return c.reported||dateLabel(c);
  const col=U.prefs.col||"landmark";
  if(col==="landmark")return (U.prefs.subj&&U.prefs.subj!=="All"?"":c.subjects[0]+" · ")+(c.topic||"General");
  if(col.startsWith("course:"))return c.topic;
  return c.kind==="syllabus"?c.course:c.subjects[0];
}
function renderList(){
  const l=currentList();let html="",last="";
  for(const c of l.slice(0,state.limit)){
    const g=groupOf(c);if(g!==last){html+=`<li class="grp">${esc(g)}</li>`;last=g}
    const t=tagOf(c);
    html+=`<li><a href="#case/${encodeURIComponent(c.id)}" aria-current="${c.id===state.caseId}">
      <span class="nm">${esc(c.name)}</span><span class="yr">${esc(c.kind==="new"?"":(c.year||""))}</span>
      <span class="tg">${c.kind==="new"?`<span class="ct">${esc(shortCourt(c.court))}</span> · `:""}${t?esc(t):"<em>No summary yet</em>"}${c.optional?' · <span class="flag opt">Optional</span>':""}${U.saved[c.id]?' · <span class="flag star">★ Saved</span>':""}${U.revised[c.id]?' · <span class="flag done">Revised</span>':""}</span></a></li>`;
  }
  if(l.length>state.limit)html+=`<li><button class="more" id="more">Show ${Math.min(150,l.length-state.limit)} more of ${l.length-state.limit}</button></li>`;
  $("#list").innerHTML=html||`<li class="empty">${state.tab==="new"?"No judgments match these filters.":(U.prefs.col==="saved"?"Nothing saved yet. Tap ☆ Save on any case.":"No cases match. Try a shorter search or clear the filters.")}</li>`;
  const m=$("#more");if(m)m.onclick=()=>{state.limit+=150;renderList()};
  if(state.tab==="new"){$("#metaline").textContent=`${l.length} judgment${l.length===1?"":"s"} · newest first`}
  else{const pool=collection(U.prefs.col||"landmark"),d=pool.filter(c=>U.revised[c.id]).length;$("#prog").textContent=`${d} of ${pool.length} revised`;$("#progbar").style.width=(pool.length?d/pool.length*100:0)+"%"}
  if(!state.caseId&&window.innerWidth>820&&l[0])renderDetail(l[0].id);
}
const shortCourt=c=>(c||"").replace("Supreme Court of India","Supreme Court");

/* ---------- case sheet ---------- */
function renderDetail(forceId){
  const id=forceId||state.caseId;const c=id&&byId(id);
  if(!c){$("#detail").innerHTML=`<p class="empty">Pick a case from the list.</p>`;return}
  const n=c.notes||(c.kind==="custom"?c:null);const tag=tagOf(c);const b=U.briefs[id]||{};
  const st=n&&STATUS[n.status];const cite=c.cite;
  const kanoon="https://indiankanoon.org/search/?formInput="+encodeURIComponent(c.name.replace(/\(.*?\)/g,"").trim());
  const F=[["F","facts","Facts in your words"],["I","issue","The legal question"],["R","rule","Rule / ratio"],["A","analysis","How the court reasoned"],["C","conclusion","Outcome and why it matters"]];
  const eyebrow=c.kind==="new"?`New judgment · ${dateLabel(c)}`:c.kind==="syllabus"?`${c.course} · ${(c.topics||[]).join(", ")}`:c.kind==="custom"?"Added by you":`${c.subjects.join(", ")}${c.topic?" · "+c.topic:""}`;
  $("#detail").innerHTML=`<button class="back" id="back">← Back</button>
   <div class="eyebrow">${esc(eyebrow)}</div>
   <h1>${esc(c.name)}</h1>
   <div class="cite">${esc(cite||"Citation not available")}${cite?' <button class="mini" id="copy">Copy</button>':""}</div>
   <div class="meta">${[c.court,c.bench,c.kind!=="new"&&c.year].filter(Boolean).map(esc).join(" · ")}</div>
   <div class="badges">${c.optional?'<span class="pill mod">Optional reading</span>':""}${st?`<span class="pill ${st[0]}">${st[1]}</span>`:""}${c.kind==="new"?c.subjects.map(s=>`<span class="pill">${esc(s)}</span>`).join(""):""}</div>
   <div class="toolbar">
     <button class="btn ${U.revised[id]?"on":""}" id="rev">${U.revised[id]?"✓ Revised":"Mark revised"}</button>
     <button class="btn ${U.saved[id]?"on":""}" id="save">${U.saved[id]?"★ Saved":"☆ Save"}</button>
     ${(tag||n)?`<button class="btn ${state.recall?"on":""}" id="recall">${state.recall?"Recall on":"Recall mode"}</button>`:""}
     ${c.link?`<a class="btn" href="${esc(c.link)}" target="_blank" rel="noopener">Open on LMS ↗</a>`:""}
     ${c.source?`<a class="btn" href="${esc(c.source)}" target="_blank" rel="noopener">Read report ↗</a>`:""}
     <a class="btn" href="${kanoon}" target="_blank" rel="noopener">Find judgment ↗</a>
     ${navigator.share?'<button class="btn" id="share">Share</button>':""}
   </div>
   <div class="${state.recall?"recall":""}">
     ${tag?`<div class="sec hideable"><h2>${c.kind==="new"?"What the court held":"Principle"}</h2><p class="ratio body">${esc(tag)}</p></div>`:(n?"":`<div class="sec"><p class="nosum">No summary yet. Open the judgment, then write the principle in one line below. It will show in your list and quiz.</p></div>`)}
     ${n&&n.facts?`<div class="sec"><h2>Facts</h2><p>${esc(n.facts)}</p></div>`:""}
     ${n&&n.issues&&n.issues.length?`<div class="sec"><h2>Issues</h2><ol>${n.issues.map(i=>`<li>${esc(i)}</li>`).join("")}</ol></div>`:""}
     ${n&&n.held?`<div class="sec hideable"><h2>Held</h2><p class="body">${esc(n.held)}</p></div>`:""}
     ${n&&n.ratio?`<div class="sec hideable"><h2>Ratio decidendi</h2><p class="ratio body">${esc(n.ratio)}</p></div>`:""}
     ${n&&n.matters?`<div class="sec"><h2>Why it matters</h2><p>${esc(n.matters)}</p></div>`:""}
     ${n&&n.history?`<div class="sec"><h2>Later history and new codes</h2><p class="statute">${esc(n.history)}</p></div>`:""}
   </div>
   ${c.kind==="custom"?"":`<div class="sec"><label class="field" for="mytag">${c.tag?"Your own wording (optional)":"Principle in one line"}<input id="mytag" value="${esc(U.mytags[id]||"")}" placeholder="${c.tag?"Rewrite it in your words to remember it":"e.g. Pledge needs delivery of goods"}"></label></div>`}
   <div class="brief"><h2>My brief</h2><p class="hint">Write the case in your own words using FIRAC. Saved on this phone.</p>
     <div class="firac">${F.map(([k,f,l])=>`<label for="b-${f}"><span><b>${k}</b>${l}</span><textarea id="b-${f}" data-f="${f}" rows="${f==="analysis"?4:2}">${esc(b[f]||"")}</textarea></label>`).join("")}</div>
     <div class="saved" id="savedmsg"></div></div>
   <p class="src">${c.kind==="new"?"Summary written from published court reporting; read the judgment before relying on it.":c.kind==="syllabus"?"From your course reading list. The LMS link needs you to be signed in.":"Principles are short study aids; check them against the judgment."}</p>`;
  $("#back").onclick=()=>{history.length>1?history.back():location.hash=state.tab};
  const cp=$("#copy");if(cp)cp.onclick=()=>navigator.clipboard.writeText(cite).then(()=>toast("Citation copied")).catch(()=>toast("Copy blocked. Select the citation instead."));
  $("#rev").onclick=()=>{U.revised[id]=!U.revised[id];if(!U.revised[id])delete U.revised[id];persist("revised");renderDetail(id);renderList()};
  $("#save").onclick=()=>{U.saved[id]=!U.saved[id];if(!U.saved[id])delete U.saved[id];persist("saved");renderDetail(id);renderList()};
  const rc=$("#recall");if(rc)rc.onclick=()=>{state.recall=!state.recall;renderDetail(id)};
  document.querySelectorAll(".hideable").forEach(h=>h.onclick=()=>{if(state.recall)h.classList.add("shown")});
  const sh=$("#share");if(sh)sh.onclick=()=>navigator.share({title:c.name,text:`${c.name}${cite?" "+cite:""}${tag?" — "+tag:""}`,url:location.href}).catch(()=>{});
  const mt=$("#mytag");if(mt){let t;mt.oninput=()=>{clearTimeout(t);t=setTimeout(()=>{const v=mt.value.trim();if(v)U.mytags[id]=v;else delete U.mytags[id];persist("mytags");$("#savedmsg").textContent="Saved";renderList()},500)}}
  let t2;document.querySelectorAll(".firac textarea").forEach(ta=>ta.oninput=()=>{U.briefs[id]=U.briefs[id]||{};U.briefs[id][ta.dataset.f]=ta.value;clearTimeout(t2);t2=setTimeout(()=>{persist("briefs");$("#savedmsg").textContent="Saved"},400)});
}

/* ---------- quiz ---------- */
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const quiz={qs:[],i:0,score:0,done:false};
function quizScopes(){
  const o=[["landmark","All landmark cases"],["new","New judgments"],["saved","Saved cases"]];
  subjectsOf(DB.cases.filter(c=>c.kind==="landmark")).forEach(s=>o.push(["subj:"+s,"Landmark · "+s]));
  [...new Set(DB.syllabus.map(c=>c.course))].forEach(c=>o.push(["course:"+c,"Syllabus · "+c]));
  return o;
}
function quizPool(s){
  if(s==="new")return DB.cases.filter(c=>c.kind==="new");
  if(s.startsWith("subj:"))return DB.cases.filter(c=>c.kind==="landmark"&&c.subjects.includes(s.slice(5)));
  return collection(s);
}
function renderQuizPage(){
  const s=U.prefs.qscope||"landmark";
  $("#v-quiz").innerHTML=`<div class="narrow"><div class="page-h"><h1>Quiz</h1><div class="row">
     <select class="select" id="qscope" style="width:auto;max-width:100%">${quizScopes().map(([k,l])=>`<option value="${esc(k)}" ${k===s?"selected":""}>${esc(l)}</option>`).join("")}</select>
     <button class="btn primary" id="qnew">New round</button></div></div><div class="card" id="qcard"></div></div>`;
  $("#qscope").onchange=e=>{U.prefs.qscope=e.target.value;persist("prefs");newRound()};
  $("#qnew").onclick=newRound;
  if(!quiz.qs.length||quiz.scope!==s)newRound();else renderQ();
}
function newRound(){
  const s=U.prefs.qscope||"landmark";quiz.scope=s;
  const pool=quizPool(s);const tagged=pool.filter(c=>tagOf(c));
  if(pool.length<4){quiz.qs=[];renderQ();return}
  quiz.qs=shuffle(pool).slice(0,10).map(c=>{
    const types=[];const topics=[...new Set(pool.map(x=>x.topic).filter(Boolean))];
    if(tagOf(c)&&tagged.length>=4)types.push("ratio","tag");
    if(c.topic&&topics.length>=4)types.push("topic");
    if(c.cite)types.push("cite");
    if(!types.length)types.push("topic");
    const type=types[Math.floor(Math.random()*types.length)];
    if(type==="tag"){const ot=shuffle(tagged.filter(x=>x.id!==c.id&&tagOf(x)!==tagOf(c))).slice(0,3);return{c,prompt:"Which principle comes from this case?",text:c.name,opts:shuffle([c,...ot]).map(x=>({ok:x.id===c.id,label:tagOf(x)}))}}
    if(type==="topic"){const w=shuffle(topics.filter(t=>t!==c.topic)).slice(0,3);return{c,prompt:"Which topic does this case belong to?",text:c.name,opts:shuffle([c.topic,...w]).map(t=>({ok:t===c.topic,label:t}))}}
    if(type==="cite"){const ot=shuffle(pool.filter(x=>x.id!==c.id)).slice(0,3);return{c,prompt:"Which case is reported at",text:c.cite,opts:shuffle([c,...ot]).map(x=>({ok:x.id===c.id,label:x.name}))}}
    const ot=shuffle(tagged.filter(x=>x.id!==c.id)).slice(0,3);return{c,prompt:"Which case laid down this?",text:tagOf(c),opts:shuffle([c,...ot]).map(x=>({ok:x.id===c.id,label:x.name}))};
  });
  quiz.i=0;quiz.score=0;quiz.done=false;renderQ();
}
function renderQ(){
  const card=$("#qcard");if(!card)return;
  if(!quiz.qs.length){card.innerHTML=`<p class="empty">Not enough cases here for a quiz. Pick another set.</p>`;return}
  if(quiz.i>=quiz.qs.length){const n=quiz.qs.length;card.innerHTML=`<p class="qprompt">Round complete</p><p class="score">${quiz.score}/${n}</p><p>${quiz.score===n?"Every answer right.":"Open the cases you missed and try recall mode."}</p><div class="qfoot"><button class="btn primary" id="again">Another round</button></div>`;$("#again").onclick=newRound;return}
  const q=quiz.qs[quiz.i];quiz.done=false;
  card.innerHTML=`<div class="qmeta"><span>Question ${quiz.i+1} of ${quiz.qs.length}</span><span>Score ${quiz.score}</span></div>
   <div class="qprompt">${esc(q.prompt)}</div><div class="qtext">${esc(q.text)}</div>
   <div class="opts">${q.opts.map((o,i)=>`<button class="opt" data-i="${i}">${esc(o.label)}</button>`).join("")}</div><div id="qx"></div>`;
  card.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{
    if(quiz.done)return;quiz.done=true;const o=q.opts[+b.dataset.i];if(o.ok)quiz.score++;
    card.querySelectorAll(".opt").forEach(x=>{x.disabled=true;const oo=q.opts[+x.dataset.i];if(oo.ok)x.classList.add("right");else if(x===b)x.classList.add("wrong")});
    const t=tagOf(q.c);
    $("#qx").innerHTML=`<div class="explain"><strong>${o.ok?"Correct.":"Not this one."}</strong> ${esc(q.c.name)}${q.c.cite?", "+esc(q.c.cite):""}${t?". "+esc(t)+".":""}</div>
     <div class="qfoot"><a class="btn" href="#case/${encodeURIComponent(q.c.id)}">Open case</a><button class="btn primary" id="qnext">${quiz.i+1<quiz.qs.length?"Next":"See score"}</button></div>`;
    $("#qnext").onclick=()=>{quiz.i++;renderQ()};
  });
}

/* ---------- me ---------- */
let installEvt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvt=e;if(state.tab==="me")renderMe()});
function renderMe(){
  const standalone=matchMedia("(display-mode: standalone)").matches||navigator.standalone;
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  const nRev=Object.keys(U.revised).length,nSaved=Object.keys(U.saved).length,nBrief=Object.keys(U.briefs).length;
  $("#v-me").innerHTML=`<div class="narrow">
   <div class="page-h"><h1>Me</h1></div>
   <div class="card"><h2>Your progress</h2><div class="stats">
     <div class="stat"><b>${nRev}</b><span>cases revised</span></div><div class="stat"><b>${nSaved}</b><span>saved</span></div><div class="stat"><b>${nBrief}</b><span>briefs written</span></div></div></div>
   ${standalone?"":`<div class="card"><h2>Install Ratio on your phone</h2>
     ${installEvt?`<p class="hint">Adds Ratio to your home screen and lets it open offline.</p><button class="btn primary" id="install">Install app</button>`:
     ios?`<ol class="steps"><li>Open this page in <b>Safari</b>.</li><li>Tap the <b>Share</b> button.</li><li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li></ol>`:
     `<ol class="steps"><li>Open this page in <b>Chrome</b>.</li><li>Tap the <b>⋮</b> menu.</li><li>Choose <b>Install app</b> or <b>Add to Home screen</b>.</li></ol>`}</div>`}
   <div class="card"><h2>Add a case</h2><p class="hint">For cases you want that aren't here. Kept on this phone.</p>
     <form class="form" id="addform">
       <label class="field full">Case name<input id="a-name" required placeholder="Olga Tellis v. Bombay Municipal Corporation"></label>
       <label class="field">Citation<input id="a-cite" placeholder="(1985) 3 SCC 545"></label>
       <label class="field">Year<input id="a-year" type="number" min="1800" max="2100" inputmode="numeric"></label>
       <label class="field">Subject<input id="a-subj" placeholder="Constitutional Law" list="subjlist"></label>
       <label class="field">Topic<input id="a-topic" placeholder="Article 21"></label>
       <label class="field full">Principle in one line<input id="a-tag" required></label>
       <label class="field full">Facts<textarea id="a-facts" rows="3"></textarea></label>
       <label class="field full">Held<textarea id="a-held" rows="3"></textarea></label>
       <div class="full row" style="justify-content:flex-end"><button class="btn primary" type="submit">Save case</button></div>
     </form><datalist id="subjlist">${subjectsOf(DB.cases).map(s=>`<option>${esc(s)}</option>`).join("")}</datalist>
     ${U.custom.length?`<ul class="list" style="margin-top:14px">${U.custom.map(c=>`<li style="display:flex;justify-content:space-between;align-items:center;gap:8px;border-bottom:1px solid var(--line);padding:8px 0"><a href="#case/${encodeURIComponent(c.id)}" style="border:0;padding:0;display:block">${esc(c.name)}</a><button class="btn danger" data-del="${esc(c.id)}">Remove</button></li>`).join("")}</ul>`:""}</div>
   <div class="card"><h2>Back up your notes</h2><p class="hint">Your briefs, saved cases and progress live on this phone. Download a backup before changing phones, then restore it on the new one.</p>
     <div class="row"><button class="btn" id="export">Download backup</button><label class="btn" for="import">Restore backup</label><input id="import" type="file" accept="application/json" hidden></div></div>
   <div class="card"><h2>About the cases</h2><p class="hint" style="margin:0">New Supreme Court and High Court judgments are added daily from published court reporting. Principles are short study aids written in plain words, not headnotes; always read the judgment before citing it. ${DB.updated?`Last update: ${new Date(DB.updated).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}.`:""}</p></div>
  </div>`;
  const ib=$("#install");if(ib)ib.onclick=async()=>{installEvt.prompt();await installEvt.userChoice;installEvt=null;renderMe()};
  $("#addform").onsubmit=e=>{e.preventDefault();const v=i=>$("#"+i).value.trim();
    U.custom.push({id:"u"+Date.now(),name:v("a-name"),cite:v("a-cite"),year:+v("a-year")||"",subjects:[v("a-subj")||"My cases"],topic:v("a-topic")||"My cases",tag:v("a-tag"),facts:v("a-facts"),held:v("a-held"),issues:[]});
    persist("custom");toast("Case saved");renderMe()};
  document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{if(b.dataset.c){U.custom=U.custom.filter(c=>c.id!==b.dataset.del);persist("custom");renderMe();toast("Removed")}else{b.dataset.c=1;b.textContent="Tap again"}});
  $("#export").onclick=()=>{const blob=new Blob([JSON.stringify({app:"ratio",v:1,exported:new Date().toISOString(),...U},null,1)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="ratio-backup-"+new Date().toISOString().slice(0,10)+".json";document.body.appendChild(a);a.click();a.remove();toast("Backup downloaded")};
  $("#import").onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{const d=JSON.parse(t);if(d.app!=="ratio")throw 0;
    ["revised","saved","briefs","mytags","custom"].forEach(k=>{if(d[k]){U[k]=k==="custom"?d[k]:{...U[k],...d[k]};persist(k)}});toast("Backup restored");renderMe()}).catch(()=>toast("That file isn't a Ratio backup."))};
}

/* ---------- start ---------- */
if("serviceWorker" in navigator&&location.protocol==="https:"){navigator.serviceWorker.register("sw.js").catch(()=>{})}
load();
})();
