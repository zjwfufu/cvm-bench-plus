'use strict';
const {categories,cases}=window.CVM_DATA;
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let category='all',query='',page=0,filtered=cases,selected=null,returnFocus=null;
const pageSize=24,dialog=$('#detail');
const categoryOf=id=>categories.find(c=>c.id===id);
const searchText=c=>(c.code+' '+c.category+' '+categoryOf(c.category).label+' '+c.prompt).toLowerCase();
const matches=c=>!query||searchText(c).includes(query.toLowerCase());
function renderCategories(){
 const list=[{id:'all',label:'All applications'},...categories];
 $('#categories').innerHTML=list.map(c=>{const count=cases.filter(x=>(c.id==='all'||x.category===c.id)&&matches(x)).length;return `<button class="category ${category===c.id?'active':''}" data-category="${c.id}" aria-pressed="${category===c.id}"><span>${esc(c.label)}</span><span class="count">${count}</span></button>`}).join('');
}
function releasePreview(){document.querySelectorAll('.card video').forEach(v=>{v.pause();v.removeAttribute('src');v.load();v.remove()})}
function render(){
 releasePreview();filtered=cases.filter(c=>(category==='all'||c.category===category)&&matches(c));
 const pages=Math.ceil(filtered.length/pageSize);page=Math.min(page,Math.max(0,pages-1));
 renderCategories();$('#category-title').textContent=category==='all'?'All applications':categoryOf(category).label;
 const start=page*pageSize,end=Math.min(start+pageSize,filtered.length);
 $('#result-count').textContent=filtered.length?`${start+1}–${end} of ${filtered.length} cases`:'0 cases';
 $('#reset').hidden=category==='all'&&!query;$('#empty').hidden=filtered.length>0;
 $('#results').innerHTML=filtered.slice(start,end).map(c=>`<article class="card" data-case="${c.id}"><button class="card-open" data-open="${c.id}" aria-label="Open ${esc(c.code)}: ${esc(categoryOf(c.category).label)}"><div class="card-media"><figure class="motion"><img src="${c.poster}" alt="Video preview for ${esc(c.code)}" loading="lazy" decoding="async" width="640" height="360"><span class="play-mark" aria-hidden="true">▶</span><figcaption>CODE VIDEO</figcaption></figure><figure><img src="${c.thumb}" alt="Reference for ${esc(c.code)}" loading="lazy" decoding="async" width="320" height="320"><figcaption>REFERENCE</figcaption></figure></div>${c.variant?`<span class="pair-chip">Pair ${c.variant}</span>`:''}<div class="card-body"><div class="card-meta"><span>${esc(categoryOf(c.category).short)}</span><span class="card-id">${esc(c.code)}</span></div><p class="card-prompt">${esc(c.prompt)}</p></div></button></article>`).join('');
 const numbered=Array.from({length:pages},(_,i)=>i).filter(i=>i===0||i===pages-1||Math.abs(i-page)<=1);
 let last=-1;
 $('#pagination').hidden=pages<=1;
 $('#pagination').innerHTML=`<span class="page-label">Page ${page+1} of ${pages}</span><div class="page-buttons"><button class="page-button" data-page="${page-1}" ${page===0?'disabled':''} aria-label="Previous page">←</button>${numbered.map(i=>{const gap=last>=0&&i-last>1;last=i;return `${gap?'<span class="page-label">…</span>':''}<button class="page-button ${i===page?'active':''}" data-page="${i}" ${i===page?'aria-current="page"':''} aria-label="Page ${i+1}">${i+1}</button>`}).join('')}<button class="page-button" data-page="${page+1}" ${page>=pages-1?'disabled':''} aria-label="Next page">→</button></div>`;
}
function reset(){category='all';query='';page=0;$('#search').value='';render()}
$('#categories').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;category=b.dataset.category;page=0;render()});
let searchTimer;$('#search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{query=$('#search').value.trim();page=0;render()},140)});
$('#reset').onclick=$('#empty-reset').onclick=reset;
$('.brand').addEventListener('click',e=>{e.preventDefault();reset();window.scrollTo({top:0,behavior:'smooth'})});
$('#pagination').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(!b||b.disabled)return;page=+b.dataset.page;render();$('#category-title').scrollIntoView({block:'start',behavior:'smooth'})});
$('#results').addEventListener('click',e=>{const b=e.target.closest('[data-open]');if(b)openCase(b.dataset.open)});
let previewTimer,previewEpoch=0;
$('#results').addEventListener('pointerover',e=>{const card=e.target.closest('.card');if(!card||card.contains(e.relatedTarget)||e.pointerType!=='mouse'||matchMedia('(prefers-reduced-motion:reduce)').matches||navigator.connection?.saveData)return;clearTimeout(previewTimer);const epoch=++previewEpoch;previewTimer=setTimeout(()=>{if(!card.isConnected||epoch!==previewEpoch)return;releasePreview();const c=cases.find(c=>c.id===card.dataset.case),v=document.createElement('video');v.muted=true;v.loop=true;v.playsInline=true;v.preload='none';v.src=c.video;card.querySelector('.motion').append(v);v.play().then(()=>{if(epoch===previewEpoch)v.classList.add('playing');else v.remove()}).catch(()=>v.remove())},450)});
$('#results').addEventListener('pointerout',e=>{const card=e.target.closest('.card');if(card&&!card.contains(e.relatedTarget)){previewEpoch++;clearTimeout(previewTimer);releasePreview()}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){previewEpoch++;clearTimeout(previewTimer);releasePreview();$('#detail-video').pause()}});
function stopDetail(){const v=$('#detail-video');v.pause();v.removeAttribute('src');v.removeAttribute('poster');v.load()}
function openCase(id){
 const c=cases.find(x=>x.id===id);if(!c)return;
 if(!dialog.open){returnFocus=document.activeElement;dialog.showModal()}
 releasePreview();stopDetail();selected=c;$('.comparison').classList.remove('reference-enlarged');$('#zoom').textContent='Enlarge ↗';
 $('#detail-category').textContent=categoryOf(c.category).label;$('#detail-title').textContent=c.code;
 $('#detail-prompt').textContent=c.prompt;$('#detail-reference').src=c.reference;$('#detail-reference').alt='Reference image for '+c.code;
 $('#video-meta').textContent=`${c.width} × ${c.height} · ${c.duration.toFixed(1)} s`;
 const v=$('#detail-video');v.poster=c.poster;v.src=c.video;$('#media-error').hidden=true;v.onerror=()=>$('#media-error').hidden=false;
 v.play().catch(()=>{});
 const pair=c.pair?cases.filter(x=>x.pair===c.pair):[];
 $('#pair-switch').innerHTML=pair.map(x=>`<button data-pair="${x.id}" class="${x.id===id?'active':''}" aria-pressed="${x.id===id}">Variant ${x.variant}</button>`).join('');
 const i=filtered.findIndex(x=>x.id===id);$('#case-position').textContent=i>=0?`${i+1} / ${filtered.length}`:'';
 $('#previous-case').disabled=i<=0;$('#next-case').disabled=i<0||i>=filtered.length-1;
 dialog.scrollTop=0;
}
function closeDetail(){dialog.close()}
$('#close').onclick=closeDetail;dialog.addEventListener('close',()=>{stopDetail();selected=null;returnFocus?.focus({preventScroll:true})});
dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDetail()});
$('#pair-switch').addEventListener('click',e=>{const b=e.target.closest('[data-pair]');if(b)openCase(b.dataset.pair)});
function moveCase(step){if(!selected)return;const i=filtered.findIndex(x=>x.id===selected.id),next=filtered[i+step];if(next)openCase(next.id)}
$('#previous-case').onclick=()=>moveCase(-1);$('#next-case').onclick=()=>moveCase(1);
$('#zoom').onclick=()=>{const enlarged=$('.comparison').classList.toggle('reference-enlarged');$('#zoom').textContent=enlarged?'Compare ↙':'Enlarge ↗'};
document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea')||e.ctrlKey||e.metaKey||e.altKey)return;if(dialog.open){if(e.key==='ArrowLeft'){e.preventDefault();moveCase(-1)}if(e.key==='ArrowRight'){e.preventDefault();moveCase(1)}}else if(e.key==='/'){e.preventDefault();$('#search').focus()}});
render();
