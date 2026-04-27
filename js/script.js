// ============================================
// ALL THINGS STORE - SCRIPT PRINCIPAL v4
// Com favoritos, filtros duplos e depoimentos
// ============================================

const WHATSAPP_NUMBER = '5511940277555';
const STORE_NAME = 'All Things Store';

// IDs dos 5 produtos favoritos (1 de cada categoria popular)
const FAVORITE_IDS = [
  '1003290',  // Caixa Angel Coleção Sortidos (Angel)
  '1004022',  // Caixa laCreme Sortidos (laCreme)
  '1002485',  // Caixa Bendito Cacao (Intenso)
  '1003636',  // Tablete LaNut Pistache Dubai (LaNut)
  '1003872'   // Caixa Gourmet (Clássicos)
];

// Estado da aplicação
let cart = [];
let currentFilter = 'all';
let currentPriceFilter = 'all';
let currentSearch = '';

// === ELEMENTOS DOM ===
const productsGrid = document.getElementById('productsGrid');
const favoritesGrid = document.getElementById('favoritesGrid');
const filtersContainer = document.getElementById('filters');
const priceFiltersContainer = document.getElementById('priceFilters');
const searchInput = document.getElementById('searchInput');
const cartBtn = document.getElementById('cartBtn');
const cartCountEl = document.getElementById('cartCount');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartCloseBtn = document.getElementById('cartClose');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const cartCheckoutBtn = document.getElementById('cartCheckout');
const toast = document.getElementById('toast');
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const catalogBtn = document.getElementById('catalogBtn');
const catalogBtnHero = document.getElementById('catalogBtnHero');

// === RENDERIZAR FAVORITOS ===
function renderFavorites() {
  if (!favoritesGrid) return;

  const favorites = FAVORITE_IDS
    .map(id => PRODUCTS.find(p => p.id === id))
    .filter(Boolean);

  favoritesGrid.innerHTML = favorites.map(p => {
    const initial = p.name.charAt(0).toUpperCase();
    const categoryName = CATEGORIES[p.category]?.name || '';
    return `
      <article class="product-card favorite-card reveal">
        <div class="product-image">
          ${categoryName ? `<span class="product-tag">${categoryName}</span>` : ''}
          <span class="product-icon">${initial}</span>
        </div>
        <div class="product-info">
          <h3>${p.name}</h3>
          <span class="product-weight">${p.weight}</span>
          <p class="product-desc">${p.desc}</p>
          <div class="product-footer">
            <div class="product-price">
              R$ ${p.price.toFixed(2).replace('.', ',')}
              <span>cada</span>
            </div>
            <button class="btn-add" data-id="${p.id}" aria-label="Adicionar ${p.name}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  favoritesGrid.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.id));
  });
}

// === RENDERIZAR FILTROS DE LINHA ===
function renderFilters() {
  let html = `<button class="filter-btn active" data-cat="all">Todos</button>`;
  for (const [key, value] of Object.entries(CATEGORIES)) {
    html += `<button class="filter-btn" data-cat="${key}">${value.name}</button>`;
  }
  filtersContainer.innerHTML = html;

  filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filtersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.cat;
      renderProducts();
    });
  });
}

// === FILTROS DE PREÇO ===
function setupPriceFilters() {
  priceFiltersContainer.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      priceFiltersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPriceFilter = btn.dataset.price;
      renderProducts();
    });
  });
}

function matchesPriceFilter(price) {
  switch (currentPriceFilter) {
    case 'low': return price < 50;
    case 'mid': return price >= 50 && price <= 100;
    case 'high': return price > 100;
    default: return true;
  }
}

// === RENDERIZAR PRODUTOS ===
function renderProducts() {
  const filtered = PRODUCTS.filter(p => {
    const matchesCategory = currentFilter === 'all' || p.category === currentFilter;
    const matchesPrice = matchesPriceFilter(p.price);
    const matchesSearch = !currentSearch ||
      p.name.toLowerCase().includes(currentSearch) ||
      p.desc.toLowerCase().includes(currentSearch);
    return matchesCategory && matchesPrice && matchesSearch;
  });

  if (filtered.length === 0) {
    productsGrid.innerHTML = `
      <div class="no-results">
        <p>Nenhum produto encontrado com esses filtros.</p>
      </div>
    `;
    return;
  }

  productsGrid.innerHTML = filtered.map(p => {
    const initial = p.name.charAt(0).toUpperCase();
    const categoryName = CATEGORIES[p.category]?.name || '';
    return `
      <article class="product-card reveal">
        <div class="product-image">
          ${categoryName ? `<span class="product-tag">${categoryName}</span>` : ''}
          <span class="product-icon">${initial}</span>
        </div>
        <div class="product-info">
          <h3>${p.name}</h3>
          <span class="product-weight">${p.weight}</span>
          <p class="product-desc">${p.desc}</p>
          <div class="product-footer">
            <div class="product-price">
              R$ ${p.price.toFixed(2).replace('.', ',')}
              <span>cada</span>
            </div>
            <button class="btn-add" data-id="${p.id}" aria-label="Adicionar ${p.name} ao carrinho">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  productsGrid.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.id));
  });

  observeReveal();
}

// === BUSCA ===
let searchTimeout;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentSearch = e.target.value.toLowerCase().trim();
    renderProducts();
  }, 250);
});

// === CARRINHO ===
function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCart();
  showToast(`${product.name} adicionado ao carrinho`);
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCart();
}

function updateQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(productId);
  } else {
    updateCart();
  }
}

function updateCart() {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCountEl.textContent = totalItems;
  cartCountEl.classList.toggle('active', totalItems > 0);

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
        <h4>Seu carrinho está vazio</h4>
        <p>Adicione produtos para começar</p>
      </div>
    `;
    cartCheckoutBtn.disabled = true;
  } else {
    cartItemsEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-img">${item.name.charAt(0).toUpperCase()}</div>
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <div class="cart-item-price">R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')}</div>
          <div class="cart-item-controls">
            <button class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="Diminuir">−</button>
            <span class="qty-display">${item.qty}</span>
            <button class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Aumentar">+</button>
            <button class="cart-item-remove" data-id="${item.id}">Remover</button>
          </div>
        </div>
      </div>
    `).join('');
    cartCheckoutBtn.disabled = false;

    cartItemsEl.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const delta = btn.dataset.action === 'inc' ? 1 : -1;
        updateQty(btn.dataset.id, delta);
      });
    });
    cartItemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
    });
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  cartTotalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function openCart() {
  cartSidebar.classList.add('open');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartSidebar.classList.remove('open');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

cartBtn.addEventListener('click', openCart);
cartCloseBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// =
