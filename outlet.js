(() => {
  'use strict';
  const cards = [...document.querySelectorAll('[data-category]')];
  const status = document.querySelector('#selection-status');
  function updateCategory() {
    const slug = window.location.hash.replace(/^#category\//, '');
    const active = cards.find(card => card.dataset.category === slug);
    cards.forEach(card => {
      if (card === active) card.setAttribute('aria-current', 'true');
      else card.removeAttribute('aria-current');
    });
    status.hidden = !active;
    status.textContent = active
      ? `${active.querySelector('h3').textContent} — категория выбрана. Раздел товаров скоро появится.`
      : '';
    document.title = active ? `${active.querySelector('h3').textContent} — D.SHE OUTLET` : 'D.SHE — OUTLET';
  }
  window.addEventListener('hashchange', updateCategory);
  updateCategory();
})();


/* PRODUCT CODE SEARCH */
(function(){
  const form = document.getElementById('code-search-form');
  const input = document.getElementById('code-search-input');
  const message = document.getElementById('code-search-message');
  if(!form || !input) return;

  let productsCache = null;

  const norm = (v) => String(v ?? '').trim().toUpperCase().replace(/\s+/g,'');

  function getProducts(data){
    if(Array.isArray(data)) return data;
    if(data && Array.isArray(data.products)) return data.products;
    if(data && Array.isArray(data.items)) return data.items;
    if(data && typeof data === 'object'){
      for(const value of Object.values(data)){
        if(Array.isArray(value) && value.length && typeof value[0] === 'object') return value;
      }
    }
    return [];
  }

  async function loadProducts(){
    if(productsCache) return productsCache;
    const res = await fetch('data/catalog.json?ts=' + Date.now(), {cache:'no-store'});
    const data = await res.json();
    productsCache = getProducts(data);
    return productsCache;
  }

  function codeOf(product){
    const candidates = [
      product.code, product.product_code, product.productCode,
      product.ProductCode, product.sku, product.SKU,
      product.article, product.Article, product.id, product.ID
    ];
    for(const value of candidates){
      if(value !== undefined && value !== null && String(value).trim()) return String(value);
    }
    return '';
  }

  function productTarget(product){
    return product.url || product.href || product.link || product.path || '';
  }

  function productImage(product){
    return product.image || product.image_path || product.imagePath || product.collage || product.photo || '';
  }

  function productCategory(product){
    return product.category || product.Category || product.group || '';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = norm(input.value);
    if(!q){
      message.textContent = '';
      input.focus();
      return;
    }

    message.textContent = 'SEARCHING...';

    try{
      const products = await loadProducts();
      const exact = products.find(p => norm(codeOf(p)) === q);
      const partial = exact || products.find(p => norm(codeOf(p)).includes(q));
      const product = partial;

      if(!product){
        message.textContent = 'PRODUCT NOT FOUND';
        return;
      }

      message.textContent = '';

      const direct = productTarget(product);
      if(direct){
        window.location.href = direct;
        return;
      }

      const code = codeOf(product);
      const category = productCategory(product);

      // If the current catalog uses hash navigation, keep that convention.
      if(category){
        window.location.hash = 'category/' + String(category).toLowerCase().replace(/\s+/g,'-');
      }

      // Dispatch a custom event so the existing viewer can react if it supports it.
      window.dispatchEvent(new CustomEvent('outlet:product-search', {detail:{product, code}}));

      // Try to locate an already-rendered product/card by code.
      const selectors = [
        `[data-code="${CSS.escape(code)}"]`,
        `[data-product-code="${CSS.escape(code)}"]`,
        `#${CSS.escape(code)}`
      ];
      for(const sel of selectors){
        const el = document.querySelector(sel);
        if(el){
          el.scrollIntoView({behavior:'smooth', block:'center'});
          el.classList.add('search-hit');
          setTimeout(()=>el.classList.remove('search-hit'),1800);
          return;
        }
      }

      // If no product cards are rendered yet, show a concise confirmation.
      const img = productImage(product);
      message.textContent = 'FOUND: ' + code;
      if(img){
        const a = document.createElement('a');
        a.href = img;
        a.textContent = ' OPEN PRODUCT';
        a.style.color = '#111';
        a.style.marginLeft = '8px';
        message.appendChild(a);
      }
    }catch(err){
      console.error(err);
      message.textContent = 'SEARCH ERROR';
    }
  });
})();

