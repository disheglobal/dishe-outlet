(() => {
  'use strict';
  const cards = [...document.querySelectorAll('[data-category]')];
  const status = document.querySelector('#selection-status');
  const form = document.querySelector('#code-search-form');
  const input = document.querySelector('#code-search-input');
  const message = document.querySelector('#code-search-message');
  const norm = value => String(value ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  const slug = value => norm(value).toLowerCase().replace(/_/g, '-');
  let productsPromise, generation = 0, opener;
  const dialog = document.createElement('dialog');
  dialog.className = 'outlet-viewer';
  dialog.setAttribute('aria-label', 'D.SHE OUTLET catalog');
  const bar = document.createElement('header');
  const close = document.createElement('button');
  close.type = 'button'; close.textContent = '← MENU';
  const heading = document.createElement('h2');
  bar.append(close, heading);
  const content = document.createElement('div');
  content.className = 'outlet-products';
  dialog.append(bar, content); document.body.append(dialog);

  function closeViewer() {
    generation++;
    if (dialog.open) dialog.close();
    document.body.classList.remove('outlet-viewing');
    history.replaceState(null, '', location.pathname + location.search + '#categories');
    if (opener?.isConnected) opener.focus();
  }
  close.addEventListener('click', closeViewer);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeViewer(); });
  async function loadProducts() {
    if (!productsPromise) {
      productsPromise = fetch('data/catalog.json', {cache:'no-store'}).then(response => {
        if (!response.ok) throw Error('catalog');
        return response.json();
      }).then(data => {
        if (!Array.isArray(data.products)) throw Error('catalog');
        return data.products;
      }).catch(error => { productsPromise = null; throw error; });
    }
    return productsPromise;
  }
  function safeImage(value) {
    if (typeof value !== 'string') return '';
    const url = new URL(value, location.href);
    return url.origin === location.origin && /^https?:$/.test(url.protocol) ? url.href : '';
  }
  function renderProduct(product) {
    const article = document.createElement('article');
    article.className = 'outlet-product';
    article.dataset.code = product.code || product.id;
    const title = document.createElement('h3');
    title.textContent = product.title || product.id;
    const detail = document.createElement('p');
    detail.textContent = [product.id, product.size ? 'Size: ' + product.size : ''].filter(Boolean).join(' · ');
    const photos = [...new Set([product.image, ...(product.photos || [])].filter(Boolean))].map(safeImage).filter(Boolean);
    const gallery = document.createElement('div');
    gallery.className = 'outlet-photos';
    gallery.tabIndex = 0;
    gallery.setAttribute('aria-label', 'Photos: ' + product.id);
    photos.forEach((source, index) => {
      const image = document.createElement('img');
      image.src = source; image.alt = product.id + ' — ' + (index + 1);
      image.loading = index ? 'lazy' : 'eager';
      gallery.append(image);
    });
    const controls = document.createElement('div');
    controls.className = 'outlet-photo-controls';
    const previous = document.createElement('button'), next = document.createElement('button'), count = document.createElement('span');
    previous.type = next.type = 'button';
    previous.textContent = '←'; next.textContent = '→';
    previous.setAttribute('aria-label', 'Previous photo'); next.setAttribute('aria-label', 'Next photo');
    let current = 0;
    const update = () => {
      current = Math.max(0, Math.min(photos.length - 1, Math.round(gallery.scrollLeft / (gallery.clientWidth || 1))));
      count.textContent = photos.length ? (current + 1) + ' / ' + photos.length : 'No photos';
      previous.disabled = current <= 0; next.disabled = current >= photos.length - 1;
    };
    previous.onclick = () => gallery.scrollTo({left:(current - 1) * gallery.clientWidth, behavior:'smooth'});
    next.onclick = () => gallery.scrollTo({left:(current + 1) * gallery.clientWidth, behavior:'smooth'});
    gallery.addEventListener('scroll', update);
    controls.append(previous, count, next);
    article.append(title, detail, gallery, controls);
    update();
    return article;
  }
  async function show(title, filter) {
    const request = ++generation;
    opener = document.activeElement === close ? opener : document.activeElement;
    heading.textContent = title;
    content.textContent = 'Loading…';
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('outlet-viewing');
    try {
      const products = (await loadProducts()).filter(filter);
      if (request !== generation) return;
      content.replaceChildren();
      if (!products.length) content.textContent = 'В этой категории пока нет моделей OUTLET.';
      products.forEach(product => content.append(renderProduct(product)));
      content.scrollTop = 0;
    } catch (_) {
      if (request === generation) content.textContent = 'Не удалось загрузить каталог. Закройте окно и попробуйте ещё раз.';
    }
  }
  function route() {
    const match = location.hash.match(/^#category\/([^/]+)$/);
    if (!match) {
      generation++;
      if (dialog.open) dialog.close();
      document.body.classList.remove('outlet-viewing');
      return;
    }
    const category = norm(decodeURIComponent(match[1]));
    status.hidden = true;
    show(category.replace(/_/g, ' '), product => norm(product.category) === category);
  }
  function bind(card) {
    card.addEventListener('click', event => {
      event.preventDefault();
      const target = '#category/' + card.dataset.category;
      if (location.hash === target) route(); else location.hash = target;
    });
  }
  cards.forEach(bind);
  // Keep uncategorized and future categories reachable without changing existing covers.
  loadProducts().then(products => {
    const known = new Set(cards.map(card => norm(card.dataset.category)));
    const extra = [...new Set(products.map(product => norm(product.category || 'OTHER')))].filter(category => !known.has(category));
    if (!extra.length) return;
    const links = document.createElement('div'); links.className = 'outlet-extra-categories';
    for (const category of extra) {
      const link = document.createElement('a');
      link.href = '#category/' + slug(category); link.dataset.category = slug(category);
      link.textContent = category === 'OTHER' ? 'OTHER / ДРУГИЕ МОДЕЛИ' : category.replace(/_/g,' ');
      bind(link); links.append(link);
    }
    document.querySelector('.category-grid').after(links);
  }).catch(() => {});
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const query = norm(input.value);
    if (!query) { message.textContent = ''; return; }
    message.textContent = '';
    await show('SEARCH: ' + input.value.trim(), product =>
      [product.code, product.id].some(value => norm(value).includes(query)));
  });
  window.addEventListener('hashchange', route);
  route();
})();
