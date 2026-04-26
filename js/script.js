// ============================================
// ALL THINGS STORE - SCRIPT PRINCIPAL
// ============================================

// CONFIGURAÇÃO - edite aqui se mudar o WhatsApp
const WHATSAPP_NUMBER = '5511940277555';
const STORE_NAME = 'All Things Store';

// Estado da aplicação
let cart = [];
let currentFilter = 'all';
let currentSearch = '';

// === ELEMENTOS DOM ===
const productsGrid = document.getElementById('productsGrid');
const filtersContainer = document.getElementById('filters');
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

// === RENDERIZAR FILTROS ===
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

// === RENDERIZAR PRODUTOS ===
function renderProducts() {
  const filtered = PRODUCTS.filter(p => {
    const matchesCategory = currentFilter === 'all' || p.category === currentFilter;
    const matchesSearch = !currentSearch ||
      p.name.toLowerCase().includes(currentSearch) ||
      p.desc.toLowerCase().includes(currentSearch);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    productsGrid.innerHTML = `
      <div class="no-results">
        <p>Nenhum produto encontrado.</p>
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
    btn.addEventListener('click', () => {
      addToCart(btn.dataset.id);
    });
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

// === FINALIZAR PEDIDO NO WHATSAPP ===
cartCheckoutBtn.addEventListener('click', () => {
  if (cart.length === 0) return;

  let message = `*Olá! Gostaria de fazer um pedido na ${STORE_NAME}:*\n\n`;
  cart.forEach(item => {
    const subtotal = (item.price * item.qty).toFixed(2).replace('.', ',');
    message += `• ${item.qty}x ${item.name} — R$ ${subtotal}\n`;
  });
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  message += `\n*Total: R$ ${total.toFixed(2).replace('.', ',')}*\n\n`;
  message += `Aguardo retorno para finalizar. Obrigado!`;

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
});

// === SOLICITAR CATÁLOGO ===
function requestCatalog() {
  const message = `Olá! Gostaria de receber o catálogo completo da ${STORE_NAME}.`;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

if (catalogBtn) catalogBtn.addEventListener('click', requestCatalog);
if (catalogBtnHero) catalogBtnHero.addEventListener('click', requestCatalog);

// === TOAST ===
let toastTimeout;
function showToast(message) {
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

// === MENU MOBILE ===
menuToggle.addEventListener('click', () => {
  navMenu.classList.toggle('open');
});

navMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navMenu.classList.remove('open'));
});

// === SCROLL SUAVE ===
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// === SCROLL REVEAL ANIMATION ===
let revealObserver;
function observeReveal() {
  if (revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
    revealObserver.observe(el);
  });
}

// === HEADER SHADOW NO SCROLL ===
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    header.style.boxShadow = 'var(--shadow-sm)';
  } else {
    header.style.boxShadow = 'none';
  }
}, { passive: true });

// === ESC FECHA CARRINHO ===
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && cartSidebar.classList.contains('open')) {
    closeCart();
  }
});

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  renderFilters();
  renderProducts();
  updateCart();
  observeReveal();
});
