const STORAGE='dietControlData_v5';
const BACKUP='dietControlBackup_v5';
const LEGACY=['weightHealthPWA_v1','dietControlData_v4','dietControlData_v3'];
const defaultState={profile:{birthDate:'',sex:'male',height:192,targetWeight:92,calorieTarget:1850,proteinTarget:150,activityTarget:150},metrics:[],meals:[],activities:[],health:[]};
const q=id=>document.getElementById(id);
const localDate=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const nowTime=()=>new Date().toTimeString().slice(0,5);
const clone=o=>JSON.parse(JSON.stringify(o));
function normalize(s){s=s||{};return {profile:{...defaultState.profile,...(s.profile||{})},metrics:Array.isArray(s.metrics)?s.metrics:[],meals:Array.isArray(s.meals)?s.meals:[],activities:Array.isArray(s.activities)?s.activities:[],health:Array.isArray(s.health)?s.health:[]}}
function loadState(){let raw=localStorage.getItem(STORAGE);if(raw){try{return normalize(JSON.parse(raw))}catch{}}for(const k of LEGACY){const x=localStorage.getItem(k);if(x){try{const s=normalize(JSON.parse(x));localStorage.setItem(STORAGE,JSON.stringify(s));return s}catch{}}}return clone(defaultState)}
let state=loadState();
function ensureIds(){['metrics','meals','activities','health'].forEach(type=>{state[type].forEach((x,i)=>{if(!x.id)x.id=`${type}-${x.date||'d'}-${x.time||'t'}-${i}-${Date.now()}`})})}
ensureIds();
function save(){localStorage.setItem(STORAGE,JSON.stringify(state));localStorage.setItem(BACKUP,JSON.stringify(state));renderAll()}
function toast(t){const el=q('toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
function age(){if(!state.profile.birthDate)return null;const b=new Date(state.profile.birthDate+'T00:00:00');const n=new Date();let a=n.getFullYear()-b.getFullYear();if(n<new Date(n.getFullYear(),b.getMonth(),b.getDate()))a--;return a}
function latest(arr){return [...arr].sort((a,b)=>(a.date||'').localeCompare(b.date||'')).at(-1)||{}}
const latestMetric=()=>latest(state.metrics), latestHealth=()=>latest(state.health);
const sum=(arr,k)=>arr.reduce((s,x)=>s+(+x[k]||0),0);
function calcBody(m=latestMetric()){const h=+state.profile.height||0,w=+m.weight||0,wa=+m.waist||0,hip=+m.hip||0;return{bmi:h&&w?w/((h/100)**2):null,whtr:h&&wa?wa/h:null,whr:wa&&hip?wa/hip:null}}
function calcHealth(h=latestHealth()){const tc=+h.totalChol||0,hdl=+h.hdl||0,tg=+h.triglycerides||0,sbp=+h.sbp||0,dbp=+h.dbp||0;return{nonHdl:tc&&hdl?tc-hdl:null,tgHdl:tg&&hdl?tg/hdl:null,pulsePressure:sbp&&dbp?sbp-dbp:null,map:sbp&&dbp?dbp+(sbp-dbp)/3:null}}
function bmiStatus(v){if(v==null)return['—',''];if(v<18.5)return['נמוך','warn'];if(v<25)return['תקין','good'];if(v<30)return['עודף משקל','warn'];return['גבוה','bad']}
function whtrStatus(v){if(v==null)return['—',''];if(v<.4)return['נמוך','warn'];if(v<.5)return['יעד מועדף','good'];if(v<.6)return['מוגבר','warn'];return['גבוה','bad']}
function whrStatus(v){if(v==null)return['—',''];const lim=state.profile.sex==='male'?.90:.85;return v<lim?['מתחת לסף','good']:['מעל הסף','warn']}
function waistStatus(v){if(!v)return['—',''];const male=state.profile.sex==='male',warn=male?94:80,high=male?102:88;if(v<warn)return['מתחת לסף','good'];if(v<high)return['מוגבר','warn'];return['גבוה','bad']}
function bpStatus(s,d){s=+s;d=+d;if(!s||!d)return['—',''];if(s<120&&d<80)return['תקין','good'];if(s<130&&d<80)return['מוגבר','warn'];if(s<140&&d<90)return['דרגה 1','warn'];if(s>=180||d>=120)return['חמור','bad'];return['דרגה 2','bad']}
function metricBox(label,value,status,color='blue'){return `<div class="metric-box ${color}"><span class="label">${label}</span><strong>${value??'—'}</strong><small>${status||''}</small></div>`}
function calorieCard(containerId){const td=localDate(),meals=state.meals.filter(x=>x.date===td),acts=state.activities.filter(x=>x.date===td);const eaten=sum(meals,'calories'),burn=sum(acts,'calories'),target=+state.profile.calorieTarget||0,remaining=target-eaten,net=eaten-burn,pct=target?Math.min(100,Math.max(0,eaten/target*100)):0;let cls='good',txt=`נותרו ${Math.max(0,remaining)} קק״ל ליעד האכילה`;if(remaining<0){cls='bad';txt=`חריגה של ${Math.abs(remaining)} קק״ל מיעד האכילה`}else if(pct>85){cls='warn';txt=`נותרו ${remaining} קק״ל ליעד האכילה`}
q(containerId).innerHTML=`<div class="card calorie-card"><div class="section-head"><h2>קלוריות היום</h2><span class="pill">${localDate().split('-').reverse().join('.')}</span></div><div class="calorie-wrap"><div class="ring" style="background:conic-gradient(var(--blue) ${pct}%,#e5e7eb ${pct}%)"><div class="ring-inner"><strong>${remaining}</strong><small>נותרו</small></div></div><div class="stat-grid"><div class="stat"><span>יעד אכילה</span><strong>${target}</strong></div><div class="stat orange"><span>נאכל</span><strong>${eaten}</strong></div><div class="stat green"><span>פעילות</span><strong><bdi dir="ltr">−${burn}</bdi></strong></div><div class="stat purple"><span>מאזן נטו</span><strong>${net}</strong></div></div></div><div class="status-line ${cls}">${txt}</div></div>`}
function renderToday(){calorieCard('todayCalorieCard');const m=latestMetric(),c=calcBody(m),first=[...state.metrics].sort((a,b)=>a.date.localeCompare(b.date))[0];q('todayWeight').textContent=m.weight?`${(+m.weight).toFixed(1)} ק״ג`:'—';q('goalWeight').textContent=state.profile.targetWeight?`${state.profile.targetWeight} ק״ג`:'—';if(first?.weight&&m.weight&&state.profile.targetWeight){const p=Math.max(0,Math.min(100,(first.weight-m.weight)/(first.weight-state.profile.targetWeight)*100));q('goalProgress').style.width=p+'%';q('weightDelta').textContent=`${(first.weight-m.weight).toFixed(1)} ק״ג שינוי מתחילת המעקב`}else{q('goalProgress').style.width='0%';q('weightDelta').textContent='הזן מדידה כדי להתחיל'}q('bodyMetricGrid').innerHTML=metricBox('BMI',c.bmi?.toFixed(1),bmiStatus(c.bmi)[0],'blue')+metricBox('מותניים/גובה',c.whtr?.toFixed(2),whtrStatus(c.whtr)[0],'purple')+metricBox('מותניים/ירכיים',c.whr?.toFixed(2),whrStatus(c.whr)[0],'orange')+metricBox('היקף מותניים',m.waist?`${m.waist} ס״מ`:'—',waistStatus(+m.waist)[0],'green');const h=latestHealth(),ch=calcHealth(h);q('homeHealthGrid').innerHTML=metricBox('לחץ דם',h.sbp&&h.dbp?`${h.sbp}/${h.dbp}`:'—',bpStatus(h.sbp,h.dbp)[0],'red')+metricBox('HbA1c',h.hba1c?`${h.hba1c}%`:'—','אחרון','orange')+metricBox('LDL',h.ldl||'—','mg/dL','purple')+metricBox('Non-HDL',ch.nonHdl!=null?Math.round(ch.nonHdl):'—','מחושב','cyan');const td=localDate(),prot=sum(state.meals.filter(x=>x.date===td),'protein'),pt=+state.profile.proteinTarget||0,pp=pt?Math.min(100,prot/pt*100):0;q('proteinProgress').style.width=pp+'%';q('proteinPct').textContent=Math.round(pp)+'%';q('proteinText').textContent=`${prot} / ${pt} גרם`}
function renderMeals(){calorieCard('mealsCalorieCard');const arr=[...state.meals].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).slice(0,50);q('mealCount').textContent=`${arr.length} רשומות`;q('mealList').innerHTML=arr.length?arr.map(x=>`<div class="history-item"><div class="history-main"><div class="history-title">${escapeHtml(x.desc||'ארוחה')}</div><div class="history-meta">${fmtDate(x.date)} ${x.time||''} · ${x.calories||0} קק״ל · ${x.protein||0} ג׳ חלבון</div></div><div class="history-side"><button class="delete-btn" onclick="deleteRecord('meals','${x.id}')">מחק</button></div></div>`).join(''):'<div class="muted">אין ארוחות שמורות</div>'}
function weekDates(){const today=new Date();const out=[];for(let i=6;i>=0;i--){const d=new Date(today);d.setDate(today.getDate()-i);out.push(localDate(d))}return out}
function renderActivity(){const ds=weekDates(),week=state.activities.filter(x=>ds.includes(x.date)),mins=sum(week,'minutes'),cals=sum(week,'calories'),count=week.length,target=+state.profile.activityTarget||150,pct=target?Math.min(100,mins/target*100):0,remaining=Math.max(0,target-mins);q('activityWeeklyCard').innerHTML=`<div class="card calorie-card"><div class="section-head"><h2>פעילות השבוע</h2><span class="pill">7 ימים</span></div><div class="calorie-wrap"><div class="ring" style="background:conic-gradient(var(--green) ${pct}%,#e5e7eb ${pct}%)"><div class="ring-inner"><strong>${remaining}</strong><small>דקות נותרו</small></div></div><div class="stat-grid"><div class="stat"><span>יעד שבועי</span><strong>${target}</strong></div><div class="stat green"><span>בוצע</span><strong>${mins}</strong></div><div class="stat orange"><span>קלוריות</span><strong>${cals}</strong></div><div class="stat purple"><span>אימונים</span><strong>${count}</strong></div></div></div><div class="status-line ${pct>=100?'good':pct>=70?'warn':''}">${pct>=100?'היעד השבועי הושג':`בוצעו ${mins} מתוך ${target} דקות`}</div></div>`;q('activityGoalPill').textContent=`${mins}/${target} דק׳`;drawActivityChart(ds);const arr=[...state.activities].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).slice(0,50);q('activityCount').textContent=`${arr.length} רשומות`;q('activityList').innerHTML=arr.length?arr.map(x=>`<div class="history-item"><div class="history-main"><div class="history-title">${escapeHtml(x.type||'פעילות')}</div><div class="history-meta">${fmtDate(x.date)} ${x.time||''} · ${x.minutes||0} דקות · ${x.calories||0} קק״ל</div></div><div class="history-side"><button class="delete-btn" onclick="deleteRecord('activities','${x.id}')">מחק</button></div></div>`).join(''):'<div class="muted">אין פעילויות שמורות</div>';const totalM=sum(state.activities,'minutes'),totalC=sum(state.activities,'calories');q('activityLifetime').innerHTML=metricBox('אימונים',state.activities.length,'סה״כ','blue')+metricBox('דקות',totalM,'סה״כ','green')+metricBox('קלוריות',totalC,'סה״כ','orange')+metricBox('ממוצע',state.activities.length?Math.round(totalM/state.activities.length):0,'דקות לאימון','purple')}
function drawActivityChart(ds){const c=q('activityChart'),ctx=c.getContext('2d'),dpr=devicePixelRatio||1,w=Math.max(300,c.clientWidth)*dpr,h=210*dpr;c.width=w;c.height=h;ctx.clearRect(0,0,w,h);const data=ds.map(date=>({date,minutes:sum(state.activities.filter(x=>x.date===date),'minutes'),calories:sum(state.activities.filter(x=>x.date===date),'calories')}));const maxM=Math.max(30,...data.map(x=>x.minutes)),maxC=Math.max(100,...data.map(x=>x.calories));const pad=28*dpr,chartH=h-55*dpr,slot=(w-pad*2)/7,bar=slot*.28;ctx.font=`${11*dpr}px Arial`;ctx.textAlign='center';data.forEach((x,i)=>{const cx=pad+slot*i+slot/2,mh=(x.minutes/maxM)*chartH,ch=(x.calories/maxC)*chartH;ctx.fillStyle='#2563eb';ctx.fillRect(cx-bar-2*dpr,h-30*dpr-mh,bar,mh);ctx.fillStyle='#16a34a';ctx.fillRect(cx+2*dpr,h-30*dpr-ch,bar,ch);ctx.fillStyle='#6b7280';ctx.fillText(dayName(x.date),cx,h-10*dpr)});ctx.strokeStyle='#e5e7eb';ctx.beginPath();ctx.moveTo(pad,h-30*dpr);ctx.lineTo(w-pad,h-30*dpr);ctx.stroke()}
function renderMetrics(){const m=latestMetric();['Weight','Waist','Hip','BodyFat'].forEach(k=>q('in'+k).value=m[k.charAt(0).toLowerCase()+k.slice(1)]||'');const c=calcBody(m);q('targetsTable').innerHTML=targetRows(c,m);drawWeightChart();const arr=[...state.metrics].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30);q('metricsHistory').innerHTML=arr.length?arr.map(x=>`<div class="history-item"><div class="history-main"><div class="history-title">${x.weight||'—'} ק״ג</div><div class="history-meta">${fmtDate(x.date)} · מותניים ${x.waist||'—'} · ירכיים ${x.hip||'—'} · שומן ${x.bodyFat||'—'}%</div></div><div class="history-side"><button class="delete-btn" onclick="deleteRecord('metrics','${x.id}')">מחק</button></div></div>`).join(''):'<div class="muted">אין מדידות שמורות</div>'}

function bodyFatTarget(){const a=age(),male=state.profile.sex==='male';if(a==null)return 'לפי גיל/מין';if(male){if(a<40)return '8–19%';if(a<60)return '11–21%';return '13–24%'}else{if(a<40)return '21–32%';if(a<60)return '23–33%';return '24–35%'}}
function targetRows(c,m){const rows=[['BMI',c.bmi?.toFixed(1)||'—','18.5–24.9',bmiStatus(c.bmi)[0]],['מותניים/גובה',c.whtr?.toFixed(2)||'—','0.40–0.49',whtrStatus(c.whtr)[0]],['מותניים/ירכיים',c.whr?.toFixed(2)||'—',state.profile.sex==='male'?'<0.90':'<0.85',whrStatus(c.whr)[0]],['היקף מותניים',m.waist?m.waist+' ס״מ':'—',state.profile.sex==='male'?'<94 ס״מ':'<80 ס״מ',waistStatus(+m.waist)[0]],['אחוז שומן',m.bodyFat?m.bodyFat+'%':'—',bodyFatTarget(),'מותאם גיל/מין']];return rows.map(r=>`<div class="target"><div><strong>${r[0]}</strong><div class="muted">נוכחי: ${r[1]}</div></div><div style="text-align:left"><span class="badge">יעד ${r[2]}</span><div class="muted">${r[3]}</div></div></div>`).join('')}
function drawWeightChart(){const c=q('weightChart'),ctx=c.getContext('2d'),arr=[...state.metrics].sort((a,b)=>a.date.localeCompare(b.date)).filter(x=>+x.weight).slice(-30),dpr=devicePixelRatio||1,w=Math.max(300,c.clientWidth)*dpr,h=210*dpr;c.width=w;c.height=h;ctx.clearRect(0,0,w,h);if(arr.length<2){ctx.fillStyle='#6b7280';ctx.font=`${14*dpr}px Arial`;ctx.fillText('נדרשות לפחות שתי שקילות',25*dpr,100*dpr);return}const vals=arr.map(x=>+x.weight),min=Math.min(...vals)-1,max=Math.max(...vals)+1,pad=28*dpr;ctx.strokeStyle='#2563eb';ctx.lineWidth=3*dpr;ctx.beginPath();arr.forEach((x,i)=>{const xx=pad+(i/(arr.length-1))*(w-pad*2),yy=h-pad-((x.weight-min)/(max-min))*(h-pad*2);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)});ctx.stroke()}
function renderHealth(){const h=latestHealth(),ch=calcHealth(h);['sbp','dbp','restingHr','totalChol','ldl','hdl','triglycerides','fastingGlucose','hba1c','creatinine','egfr','uacr','apoB','lpa','prevent10','prevent30'].forEach(k=>{if(q('h_'+k))q('h_'+k).value=h[k]??''});q('h_smoking').checked=!!h.smoking;q('h_diabetes').checked=!!h.diabetes;q('h_bpMeds').checked=!!h.bpMeds;q('healthDerived').innerHTML=[['לחץ דם',h.sbp&&h.dbp?`${h.sbp}/${h.dbp}`:'—','<120/80',bpStatus(h.sbp,h.dbp)[0]],['LDL',h.ldl||'—','תלוי סיכון',''],['Non-HDL',ch.nonHdl!=null?Math.round(ch.nonHdl):'—','תלוי סיכון','מחושב'],['TG/HDL',ch.tgHdl!=null?ch.tgHdl.toFixed(2):'—','מדד משלים',''],['HbA1c',h.hba1c?`${h.hba1c}%`:'—','<5.7% ללא סוכרת',''],['גלוקוז',h.fastingGlucose||'—','<100',''],['eGFR',h.egfr||'—','פענוח רפואי',''],['UACR',h.uacr||'—','פענוח רפואי',''],['PREVENT 10',h.prevent10?`${h.prevent10}%`:'—','לפי מחשבון רשמי',''],['PREVENT 30',h.prevent30?`${h.prevent30}%`:'—','לפי מחשבון רשמי','']].map(r=>`<div class="target"><div><strong>${r[0]}</strong><div class="muted">נוכחי: ${r[1]}</div></div><div style="text-align:left"><span class="badge">יעד ${r[2]}</span><div class="muted">${r[3]}</div></div></div>`).join('');const arr=[...state.health].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30);q('healthHistory').innerHTML=arr.length?arr.map(x=>`<div class="history-item"><div class="history-main"><div class="history-title">${fmtDate(x.date)} · ${x.sbp&&x.dbp?x.sbp+'/'+x.dbp:'ללא לחץ דם'}</div><div class="history-meta">LDL ${x.ldl||'—'} · HbA1c ${x.hba1c||'—'}% · גלוקוז ${x.fastingGlucose||'—'}</div></div><div class="history-side"><button class="delete-btn" onclick="deleteRecord('health','${x.id}')">מחק</button></div></div>`).join(''):'<div class="muted">אין נתוני בריאות שמורים</div>'}
function renderReports(){const ds=weekDates(),meals=state.meals.filter(x=>ds.includes(x.date)),acts=state.activities.filter(x=>ds.includes(x.date)),mets=state.metrics.filter(x=>ds.includes(x.date));const avgW=mets.length?(sum(mets,'weight')/mets.length).toFixed(1):'—';q('weeklySummary').innerHTML=[['משקל ממוצע',`${avgW} ק״ג`],['קלוריות ממוצעות',Math.round(sum(meals,'calories')/7)],['חלבון ממוצע',`${Math.round(sum(meals,'protein')/7)} ג׳`],['פעילות',`${acts.length} אימונים`],['דקות פעילות',sum(acts,'minutes')],['קלוריות פעילות',sum(acts,'calories')]].map(r=>`<div class="target"><strong>${r[0]}</strong><span>${r[1]}</span></div>`).join('');q('reportTargets').innerHTML=targetRows(calcBody(),latestMetric())}
function fillSettings(){const p=state.profile;q('birthDate').value=p.birthDate||'';q('sex').value=p.sex||'male';q('height').value=p.height||'';q('targetWeight').value=p.targetWeight||'';q('calorieTarget').value=p.calorieTarget||'';q('proteinTarget').value=p.proteinTarget||'';q('activityTarget').value=p.activityTarget||150}
function renderAll(){renderToday();renderMeals();renderActivity();renderMetrics();renderHealth();renderReports();fillSettings()}
function deleteRecord(type,id){if(!confirm('למחוק את הרשומה?'))return;state[type]=state[type].filter(x=>String(x.id)!==String(id));save();toast('הרשומה נמחקה')}
window.deleteRecord=deleteRecord;
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function fmtDate(s){if(!s)return'';const [y,m,d]=s.split('-');return `${d}.${m}.${y}`}
function dayName(s){return ['א','ב','ג','ד','ה','ו','ש'][new Date(s+'T12:00:00').getDay()]}
function validScreen(s){return ['today','meals','activity','metrics','health','reports','settings','data','diagnostics'].includes(s)}
function go(name,hash=true){if(!validScreen(name))name='today';document.querySelectorAll('.screen').forEach(x=>x.classList.toggle('active',x.dataset.screen===name));document.querySelectorAll('[data-screen-btn]').forEach(x=>x.classList.toggle('active',x.dataset.screenBtn===name));q('pageTitle').textContent={today:'היום',meals:'ארוחות',activity:'פעילות',metrics:'מדדי גוף',health:'בריאות',reports:'דוחות',settings:'הגדרות',data:'נתונים',diagnostics:'אבחון התקנה'}[name];if(hash)history.replaceState(null,'','#'+name);scrollTo(0,0);if(name==='activity')setTimeout(()=>drawActivityChart(weekDates()),20);if(name==='metrics')setTimeout(drawWeightChart,20);if(name==='diagnostics')setTimeout(runInstallDiagnostics,80)}
document.querySelectorAll('[data-screen-btn]').forEach(b=>b.onclick=()=>go(b.dataset.screenBtn));document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));q('settingsBtn').onclick=()=>go('settings');
q('saveSettings').onclick=()=>{state.profile={birthDate:q('birthDate').value,sex:q('sex').value,height:+q('height').value||0,targetWeight:+q('targetWeight').value||0,calorieTarget:+q('calorieTarget').value||0,proteinTarget:+q('proteinTarget').value||0,activityTarget:+q('activityTarget').value||150};save();go('today');toast('ההגדרות נשמרו')};
q('saveMeal').onclick=()=>{state.meals.push({id:crypto.randomUUID?crypto.randomUUID():Date.now()+'m',date:localDate(),time:nowTime(),desc:q('mealDesc').value.trim()||'ארוחה',calories:+q('mealCalories').value||0,protein:+q('mealProtein').value||0});q('mealDesc').value='';q('mealCalories').value='';q('mealProtein').value='';save();go('meals');toast('הארוחה נשמרה')};
q('saveActivity').onclick=()=>{state.activities.push({id:crypto.randomUUID?crypto.randomUUID():Date.now()+'a',date:localDate(),time:nowTime(),type:q('actType').value,minutes:+q('actMinutes').value||0,calories:+q('actCalories').value||0});q('actMinutes').value='';q('actCalories').value='';save();go('activity');toast('הפעילות נשמרה')};
q('saveMetrics').onclick=()=>{state.metrics.push({id:crypto.randomUUID?crypto.randomUUID():Date.now()+'x',date:localDate(),weight:+q('inWeight').value||0,waist:+q('inWaist').value||0,hip:+q('inHip').value||0,bodyFat:+q('inBodyFat').value||0});save();go('metrics');toast('המדידה נשמרה')};
q('saveHealth').onclick=()=>{const rec={id:crypto.randomUUID?crypto.randomUUID():Date.now()+'h',date:q('healthDate').value||localDate()};['sbp','dbp','restingHr','totalChol','ldl','hdl','triglycerides','fastingGlucose','hba1c','creatinine','egfr','uacr','apoB','lpa','prevent10','prevent30'].forEach(k=>rec[k]=+q('h_'+k).value||'');rec.smoking=q('h_smoking').checked;rec.diabetes=q('h_diabetes').checked;rec.bpMeds=q('h_bpMeds').checked;state.health.push(rec);save();go('health');toast('נתוני הבריאות נשמרו')};
function backupPayload(){return{app:'Diet Control',version:'5.2',exportedAt:new Date().toISOString(),data:state}}
function downloadBackup(){const blob=new Blob([JSON.stringify(backupPayload(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Diet_Control_Backup_${localDate()}.json`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},3000);q('backupStatus').textContent=`יוצא גיבוי בתאריך ${fmtDate(localDate())}`;toast('קובץ הגיבוי נוצר')}
q('exportBtn').onclick=downloadBackup;
q('shareBtn').onclick=async()=>{const file=new File([JSON.stringify(backupPayload(),null,2)],`Diet_Control_Backup_${localDate()}.json`,{type:'application/json'});if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'Diet Control Backup'});q('backupStatus').textContent='הגיבוי שותף / נשמר'}else downloadBackup()};
q('importFile').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const obj=JSON.parse(await f.text()),data=obj.data||obj;state=normalize(data);ensureIds();save();q('backupStatus').textContent=`יובא גיבוי: ${f.name}`;toast('הגיבוי יובא בהצלחה');go('today')}catch{alert('קובץ הגיבוי אינו תקין')}finally{e.target.value=''}};
let deferredPrompt=window.__dietControlInstallPrompt||null;
const installBtn=q('installBtn');
function standalone(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}
function updateInstall(){
  if(!installBtn)return;
  deferredPrompt=deferredPrompt||window.__dietControlInstallPrompt||null;
  installBtn.hidden=standalone()||!deferredPrompt;
}
function captureInstallPrompt(e){
  e.preventDefault();
  deferredPrompt=e;
  window.__dietControlInstallPrompt=e;
  updateInstall();
}
window.addEventListener('beforeinstallprompt',captureInstallPrompt);
window.addEventListener('dietcontrol-install-ready',()=>{deferredPrompt=window.__dietControlInstallPrompt||deferredPrompt;updateInstall()});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;window.__dietControlInstallPrompt=null;updateInstall();toast('האפליקציה הותקנה')});
installBtn.onclick=async()=>{
  deferredPrompt=deferredPrompt||window.__dietControlInstallPrompt||null;
  if(!deferredPrompt){updateInstall();return}
  deferredPrompt.prompt();
  const choice=await deferredPrompt.userChoice.catch(()=>null);
  if(choice&&choice.outcome==='accepted')toast('ההתקנה אושרה');
  deferredPrompt=null;window.__dietControlInstallPrompt=null;updateInstall();
};
updateInstall();

function diagRow(label,status,detail,kind='neutral'){
  return `<div class="diag-row ${kind}"><div><strong>${label}</strong><div class="muted">${detail||''}</div></div><span class="diag-badge">${status}</span></div>`;
}
async function imageDimensions(url){
  return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve({ok:true,w:img.naturalWidth,h:img.naturalHeight});img.onerror=()=>resolve({ok:false,w:0,h:0});img.src=url+(url.includes('?')?'&':'?')+'diag='+Date.now()});
}
async function runInstallDiagnostics(){
  const list=q('diagnosticList'),details=q('diagnosticDetails'),overall=q('diagOverall');
  if(!list)return;
  list.innerHTML='<div class="muted">מבצע בדיקות…</div>'; overall.textContent='בודק…'; overall.className='diag-overall';
  const rows=[]; let failures=0,warnings=0;
  const add=(label,ok,detail,warn=false)=>{const kind=ok?'good':warn?'warn':'bad';if(!ok){warn?warnings++:failures++}rows.push(diagRow(label,ok?'תקין':warn?'בדוק':'בעיה',detail,kind));};
  const secure=location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname);
  add('HTTPS / הקשר מאובטח',secure,`${location.protocol}//${location.host}`);
  const stand=standalone();
  rows.push(diagRow('מצב תצוגה',stand?'מותקן / Standalone':'דפדפן',stand?'האפליקציה נפתחה כאפליקציה עצמאית':'האפליקציה פתוחה בתוך Chrome',stand?'good':'neutral'));
  const manifestLink=document.querySelector('link[rel="manifest"]');
  let manifest=null, manifestUrl='';
  try{
    if(!manifestLink)throw new Error('לא נמצא link rel=manifest');
    manifestUrl=new URL(manifestLink.getAttribute('href'),location.href).href;
    const r=await fetch(manifestUrl,{cache:'no-store'}); if(!r.ok)throw new Error(`HTTP ${r.status}`); manifest=await r.json();
    add('Web App Manifest',true,manifestUrl);
  }catch(e){add('Web App Manifest',false,String(e.message||e));}
  if(manifest){
    add('שם אפליקציה',!!(manifest.name&&manifest.short_name),`${manifest.name||'—'} / ${manifest.short_name||'—'}`);
    add('display: standalone',['standalone','fullscreen','minimal-ui'].includes(manifest.display),`display=${manifest.display||'—'}`);
    add('start_url',!!manifest.start_url,manifest.start_url||'חסר');
    const icons=Array.isArray(manifest.icons)?manifest.icons:[];
    const icon192=icons.find(i=>String(i.sizes||'').split(/\s+/).includes('192x192'));
    const icon512=icons.find(i=>String(i.sizes||'').split(/\s+/).includes('512x512')&&String(i.purpose||'any').includes('any'));
    const mask=icons.find(i=>String(i.sizes||'').includes('512x512')&&String(i.purpose||'').includes('maskable'));
    add('אייקון 192×192',!!icon192,icon192?.src||'חסר');
    add('אייקון 512×512',!!icon512,icon512?.src||'חסר');
    add('אייקון maskable',!!mask,mask?.src||'חסר',!mask);
    for(const [label,icon] of [['קובץ אייקון 192',icon192],['קובץ אייקון 512',icon512],['קובץ Maskable',mask]]){
      if(!icon)continue; const u=new URL(icon.src,manifestUrl).href; const d=await imageDimensions(u); add(label,d.ok&&d.w>0, d.ok?`${d.w}×${d.h} — ${u}`:`לא ניתן לטעון ${u}`);
    }
  }
  const swSupported='serviceWorker' in navigator;
  add('Service Worker נתמך',swSupported,swSupported?'הדפדפן תומך':'לא נתמך');
  let regs=[];
  if(swSupported){
    try{regs=await navigator.serviceWorker.getRegistrations();add('Service Worker רשום',regs.length>0,regs.length?`${regs.length} רישום/ים`:'לא נמצא רישום');}
    catch(e){add('Service Worker רשום',false,String(e.message||e));}
    const controller=!!navigator.serviceWorker.controller;
    add('העמוד נשלט ע״י Service Worker',controller,controller?navigator.serviceWorker.controller.scriptURL:'אין controller פעיל',!controller);
  }
  const promptReady=!!(deferredPrompt||window.__dietControlInstallPrompt);
  if(stand) rows.push(diagRow('beforeinstallprompt','לא נדרש','האפליקציה כבר במצב standalone','good'));
  else add('beforeinstallprompt התקבל',promptReady,promptReady?'Chrome אישר הצגת חלון התקנה':'Chrome לא מסר כרגע אירוע התקנה',true);
  let related='לא נתמך';
  try{if(navigator.getInstalledRelatedApps){const a=await navigator.getInstalledRelatedApps();related=`${a.length} אפליקציות קשורות מזוהות`;}}
  catch(e){related='שגיאה בבדיקה';}
  rows.push(diagRow('Installed Related Apps','מידע',related,'neutral'));
  list.innerHTML=rows.join('');
  overall.textContent=failures?`${failures} בעיות`:warnings?`${warnings} לבדיקה`:'הכול תקין';
  overall.className='diag-overall '+(failures?'bad':warnings?'warn':'good');
  const reg=regs[0];
  details.innerHTML=`<div><strong>כתובת:</strong> ${location.href}</div><div><strong>User Agent:</strong> ${navigator.userAgent}</div><div><strong>Manifest:</strong> ${manifestUrl||'—'}</div><div><strong>SW scope:</strong> ${reg?.scope||'—'}</div><div><strong>SW script:</strong> ${reg?.active?.scriptURL||reg?.installing?.scriptURL||'—'}</div><div><strong>display-mode standalone:</strong> ${stand?'כן':'לא'}</div><div><strong>install prompt ready:</strong> ${promptReady?'כן':'לא'}</div>`;
}
if(q('runDiagnostics'))q('runDiagnostics').onclick=runInstallDiagnostics;
if(q('diagInstallBtn'))q('diagInstallBtn').onclick=async()=>{
  deferredPrompt=deferredPrompt||window.__dietControlInstallPrompt||null;
  if(standalone()){toast('האפליקציה כבר פתוחה במצב מותקן');return}
  if(deferredPrompt){deferredPrompt.prompt();const choice=await deferredPrompt.userChoice.catch(()=>null);deferredPrompt=null;window.__dietControlInstallPrompt=null;updateInstall();if(choice?.outcome==='accepted')toast('ההתקנה אושרה');setTimeout(runInstallDiagnostics,700);return}
  alert('Chrome לא מסר כרגע אירוע התקנה. פתח את תפריט ⋮ של Chrome ובדוק אם מופיע “התקנת אפליקציה”. במסך האבחון ניתן לראות איזה תנאי אינו מזוהה.');
};
if(q('resetPwaCache'))q('resetPwaCache').onclick=async()=>{
  if(!confirm('לאפס Service Worker ומטמון של האפליקציה? הנתונים האישיים שלך לא יימחקו.'))return;
  try{if('serviceWorker'in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()));}if('caches'in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)));}toast('המטמון אופס — טוען מחדש');setTimeout(()=>location.reload(),900);}catch(e){alert('לא ניתן לאפס את המטמון: '+e.message)}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-go="diagnostics"]');if(b)setTimeout(runInstallDiagnostics,80)});

q('healthDate').value=localDate();
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
renderAll();const initial=(location.hash||'#today').slice(1);go(validScreen(initial)?initial:'today',false);window.addEventListener('hashchange',()=>go((location.hash||'#today').slice(1),false));
