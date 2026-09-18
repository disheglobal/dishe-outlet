const app=document.getElementById('app');let db={products:[]};
const MENU_ORDER=['BIG_SIZE','DRESS','JACKET','PANTS','KNITWEAR','SHIRT','SKIRT','SUIT','LEATHER','OUTFIT','BAG'];
const MENU_TOP={BIG_SIZE:19.05,DRESS:25.30,JACKET:31.60,PANTS:37.90,KNITWEAR:44.15,SHIRT:50.45,SKIRT:56.75,SUIT:63.05,LEATHER:69.35,OUTFIT:75.65,BAG:81.95};
fetch('data/catalog.json').then(r=>r.json()).then(j=>{db=j;home()}).catch(()=>app.innerHTML='<div class="empty">CATALOG ERROR</div>');
const exists=src=>new Promise(ok=>{const i=new Image();i.onload=()=>ok(true);i.onerror=()=>ok(false);i.src=src+'?v='+Date.now()});
async function home(){const has=await exists('assets/menu.jpg');if(!has){app.innerHTML='<div class="empty">MENU.JPG NOT FOUND</div>';return}const buttons=MENU_ORDER.map(c=>`<button class="hotspot" data-c="${c}" aria-label="${c}" style="top:${MENU_TOP[c]}%"></button>`).join('');app.innerHTML=`<section class="screen home"><div class="menu-stage"><img class="menu-image" src="assets/menu.jpg" alt="D.SHE categories">${buttons}</div></section>`;document.querySelectorAll('.hotspot').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();openCategory(b.dataset.c)}))}
async function openCategory(cat){const products=db.products.filter(p=>(p.categories || [p.category]).includes(cat)),cover=`assets/covers/${cat}.jpg`,hasCover=await exists(cover),hasEnd=await exists('assets/END.jpg'),slides=[];slides.push(hasCover?`<article class="slide cover"><img src="${cover}" alt="${cat}"></article>`:`<article class="slide cover"><div class="cover-title">${cat}</div></article>`);products.forEach(p=>slides.push(`<article class="slide product-slide"><div class="product-stage"><img src="${p.image}" alt="${p.title||p.code}"><button class="product-menu-hotspot" aria-label="Categories"></button></div></article>`));if(hasEnd)slides.push('<article class="slide end-slide"><img src="assets/END.jpg" alt="End"><button class="end-hotspot" aria-label="Categories"></button></article>');app.innerHTML=`<section class="screen viewer"><div class="topbar"><button class="menu">MENU</button><div class="counter">1 / ${slides.length}</div></div><div class="slides">${slides.join('')}</div><div class="hint">SWIPE</div></section>`;document.querySelector('.menu').onclick=home;document.querySelectorAll('.product-menu-hotspot,.end-hotspot').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();home()});const el=document.querySelector('.slides'),counter=document.querySelector('.counter');el.onscroll=()=>{const i=Math.round(el.scrollLeft/el.clientWidth);counter.textContent=`${i+1} / ${slides.length}`}}


// OUTLET_GALLERY_V1
const openOutletCategoryBase = openCategory;
openCategory = async function(cat) {
  await openOutletCategoryBase(cat);
  const products = db.products.filter(p => (p.categories || [p.category]).includes(cat));
  document.querySelectorAll('.product-stage').forEach((stage, index) => {
    const product = products[index];
    const photos = [...new Set([product.image, ...(product.photos || [])])];
    if (photos.length < 2) return;
    let current = 0;
    const panel = document.createElement('div');
    panel.className = 'outlet-photo-controls';
    const previous = document.createElement('button');
    previous.textContent = '‹'; previous.setAttribute('aria-label', 'Предыдущее фото');
    const counter = document.createElement('span');
    const next = document.createElement('button');
    next.textContent = '›'; next.setAttribute('aria-label', 'Следующее фото');
    function show(delta) {
      current = (current + delta + photos.length) % photos.length;
      stage.querySelector('img').src = photos[current];
      counter.textContent = (current + 1) + ' / ' + photos.length;
    }
    previous.onclick = e => { e.stopPropagation(); show(-1); };
    next.onclick = e => { e.stopPropagation(); show(1); };
    panel.append(previous, counter, next); stage.append(panel); show(0);
  });
};
if (!document.getElementById('outlet-gallery-style')) {
  const style = document.createElement('style');
  style.id = 'outlet-gallery-style';
  style.textContent = '.outlet-photo-controls{position:absolute;z-index:9;bottom:5%;right:5%;display:flex;align-items:center;gap:12px;background:rgba(0,0,0,.8);border:1px solid #b49b69;border-radius:24px;padding:3px 8px;color:white;font:13px Arial;line-height:normal}.outlet-photo-controls button{border:0;background:transparent;color:white;font:28px Arial;min-width:38px;min-height:40px;cursor:pointer}';
  document.head.append(style);
}



// OUTLET_PERFORMANCE_V2
(() => {
  const seen = new WeakSet();
  let observer = null;
  const loadFull = img => {
    if (!img || img.dataset.fullLoaded === '1') return;
    const full = img.dataset.full;
    if (!full) return;
    img.dataset.fullLoaded = '1';
    const preload = new Image();
    preload.decoding = 'async';
    preload.onload = () => { img.src = full; };
    preload.src = full;
  };
  const getObserver = () => {
    if (observer || !('IntersectionObserver' in window)) return observer;
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) loadFull(entry.target); });
    }, {root: null, rootMargin: '0px 110% 0px 110%', threshold: 0.01});
    return observer;
  };
  const prepare = root => {
    (root || document).querySelectorAll?.('.catalog-product-image[data-full]').forEach(img => {
      if (seen.has(img)) return;
      seen.add(img);
      img.loading = 'lazy';
      img.decoding = 'async';
      const io = getObserver();
      if (io) io.observe(img); else loadFull(img);
    });
  };
  new MutationObserver(mutations => {
    mutations.forEach(m => m.addedNodes.forEach(node => {
      if (node.nodeType === 1) prepare(node);
    }));
    prepare(document);
  }).observe(document.documentElement, {childList:true, subtree:true});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => prepare(document));
  else prepare(document);
})();
