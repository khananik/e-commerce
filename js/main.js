// Helpers
const formatPrice = (price) => "$" + Number(price).toFixed(2);
const getParam = (name) => {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
};

// Product categories map to their dedicated product-type page
const CATEGORY_PAGES = {
  Clothing: "clothing.html",
  Shoes: "footwear.html",
  Accessories: "accessories.html",
};

const categoryPageUrl = (category) =>
  CATEGORY_PAGES[category] || "index.html";

// Mobile navigation
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector("#nav-menu");

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
};

// Reveal sections as they scroll in
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

// Observe all reveal targets
document.querySelectorAll("[data-animate], .reveal").forEach((el) =>
  revealObserver.observe(el)
);

// Products — data/products.json is the single source of truth
let products = [];
let cartCountEl = document.querySelector("#cart-count");

let productsPromise = null;
function loadProducts() {
  if (!productsPromise) {
    productsPromise = (async () => {
      try {
        const res = await fetch("data/products.json");
        if (res.ok) products = await res.json();
      } catch (e) {
        products = [];
      }
      return products;
    })();
  }
  return productsPromise;
}

// Best sellers are driven by metadata in data/products.json.
const getBestSellers = () =>
  products
    .filter((p) => p.bestSeller)
    .sort(
      (a, b) =>
        (a.bestSellerRank ?? Infinity) - (b.bestSellerRank ?? Infinity)
    );

// ---------- Product grids (homepage + category pages) ----------

const productGrid = document.getElementById("product-grid");

if (productGrid) {
  // Category pages declare their type with data-category; the homepage shows best sellers.
  const gridCategory = productGrid.dataset.category || "";

  const renderGrid = (list) => {
    productGrid.innerHTML = list
      .map(
        (p) =>
          `<article class="product" data-animate>
            <a class="product-link" href="product-detail.html?id=${p.id}">
              <div class="product-image-wrapper">
                ${
                  p.imageSrc
                    ? `<img class="product-image" src="${p.imageSrc}" alt="${p.name}" loading="lazy" />`
                    : `<span class="product-image product-image--${p.imageClass}"></span>`
                }
              </div>
              <span class="product-name">${p.name}</span>
              <span class="product-price">${formatPrice(p.price)}</span>
            </a>
          </article>`
      )
      .join("\n");
    productGrid.querySelectorAll("[data-animate]").forEach((el) => revealObserver.observe(el));
  };

  // Homepage demo quick-add — category pages open the product detail instead.
  if (!gridCategory) {
    productGrid.addEventListener("click", (e) => {
      const link = e.target.closest(".product-link");
      if (!link) return;
      e.preventDefault();
      const id = link.getAttribute("href").match(/id=([^&]+)/)?.[1];
      if (!id) return;
      const product = products.find((p) => p.id === id);
      if (product) {
        addToCart(product);
        cartCountEl.classList.add("bumped");
        setTimeout(() => cartCountEl.classList.remove("bumped"), 260);
      }
    });
  }

  loadProducts().then(() => {
    let list;
    if (gridCategory) {
      list = products.filter((p) => p.category === gridCategory);
    } else {
      const bestSellers = getBestSellers();
      list = bestSellers.length ? bestSellers : products;
    }

    renderGrid(list);
    updateCartBadge();
  });
};

// ---------- Product detail page ----------

const productDetail = document.getElementById("product-detail");

if (productDetail) {
  const detailContainer = document.getElementById("product-detail-body");
  const relatedGrid = document.getElementById("related-products");

  const renderDetail = (product) => {
    document.title = `${product.name} — Shammy's Clothing`;
    detailContainer.innerHTML = `
      <div class="detail-images">
        <div class="detail-main-image">
          ${
            product.imageSrc
              ? `<img src="${product.imageSrc}" alt="${product.name}" />`
              : `<span class="product-image product-image--${product.imageClass}"></span>`
          }
        </div>
      </div>
      <div class="detail-info">
        <a class="detail-back" href="${categoryPageUrl(product.category)}">← Back to ${product.category}</a>
        <span class="detail-category">${product.category}</span>
        <h1 class="detail-title">${product.name}</h1>
        <span class="detail-sku">SKU: ${product.sku}</span>
        <p class="detail-price">${formatPrice(product.price)}</p>
        <p class="detail-desc">${product.description}</p>
        <div class="detail-sizes">
          <span class="size-label">Size</span>
          <button class="size-btn active" data-size="S">S</button>
          <button class="size-btn" data-size="M">M</button>
          <button class="size-btn" data-size="L">L</button>
          <button class="size-btn" data-size="XL">XL</button>
        </div>
        <button class="btn btn-primary detail-add" type="button">Add to basket</button>
      </div>
    `;

    // Size selector
    const sizeBtns = detailContainer.querySelectorAll(".size-btn");
    sizeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        sizeBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    // Add to basket
    const addBtn = detailContainer.querySelector(".detail-add");
    addBtn.addEventListener("click", () => {
      addToCart(product);
      addBtn.textContent = "Added";
      setTimeout(() => (addBtn.textContent = "Add to basket"), 1200);
    });
  };

  const renderRelated = (product) => {
    const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
    relatedGrid.innerHTML = related
      .map(
        (p) =>
          `<article class="product">
            <a class="product-link" href="product-detail.html?id=${p.id}">
              <div class="product-image-wrapper">
                ${
                  p.imageSrc
                    ? `<img class="product-image" src="${p.imageSrc}" alt="${p.name}" loading="lazy" />`
                    : `<span class="product-image product-image--${p.imageClass}"></span>`
                }
              </div>
              <span class="product-name">${p.name}</span>
              <span class="product-price">${formatPrice(p.price)}</span>
            </a>
          </article>`
      )
      .join("\n");
  };

  loadProducts().then(() => {
    const id = getParam("id");
    const product = products.find((p) => p.id === id);
    if (product) {
      renderDetail(product);
      renderRelated(product);
      updateCartBadge();
    } else {
      detailContainer.innerHTML =
        '<p class="products-notice">Product not found.</p>';
    }
  });
};

// ---------- Header actions (search, account, wishlist, basket) ----------

const wishlistCountEl = document.createElement("span");
wishlistCountEl.className = "wishlist-count";
wishlistCountEl.textContent = "0";
let wishlistCount = 0;

let isLoggedIn = false;

// Search overlay
function openSearchOverlay() {
  const existing = document.querySelector(".search-overlay");
  if (existing) {
    existing.remove();
    return;
  }

  const overlay = document.createElement("div");
  overlay.className = "search-overlay";
  overlay.innerHTML = `
    <div class="search-content">
      <button class="search-close" aria-label="Close search">✕</button>
      <h2>Search</h2>
      <input type="text" id="search-input" placeholder="Search products…" autofocus />
      <div id="search-results"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector("#search-input");
  const results = overlay.querySelector("#search-results");
  const close = overlay.querySelector(".search-close");

  const renderResults = (query) => {
    const lower = query.toLowerCase();
    const matches = products.filter(
      (p) => p.name.toLowerCase().includes(lower) || p.category.toLowerCase().includes(lower)
    );
    if (!query.trim()) {
      results.innerHTML = "";
      return;
    }
    if (matches.length === 0) {
      results.innerHTML = '<p class="search-empty">No results found</p>';
      return;
    }
    results.innerHTML = matches
      .map(
        (p) =>
          `<a class="search-result" href="product-detail.html?id=${p.id}">
            <span class="search-result-name">${p.name}</span>
            <span class="search-result-price">${formatPrice(p.price)}</span>
          </a>`
      )
      .join("\n");
  };

  input.addEventListener("input", (e) => renderResults(e.target.value));
  renderResults("");

  close.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  input.focus();
}

// Cart state — persisted in localStorage
let cart = JSON.parse(localStorage.getItem("shammys_cart") || "[]");

// Wishlist toggle
function toggleWishlist(link) {
  const svg = link.querySelector("svg");
  const path = svg.querySelector("path");
  const isFilled = svg.classList.toggle("filled");

  if (isFilled) {
    wishlistCount += 1;
    path.setAttribute("fill", "currentColor");
  } else {
    wishlistCount = Math.max(0, wishlistCount - 1);
    path.removeAttribute("fill");
  }

  wishlistCountEl.textContent = String(wishlistCount);
  if (wishlistCount > 0 && !document.querySelector(".wishlist-count")) {
    link.appendChild(wishlistCountEl);
  } else if (wishlistCount === 0) {
    wishlistCountEl.remove();
  }
}

function saveCart() {
  localStorage.setItem("shammys_cart", JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const totalQty = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  if (cartCountEl) {
    cartCountEl.textContent = String(totalQty);
    cartCountEl.classList.toggle("hidden", totalQty === 0);
  }
}

function addToCart(product) {
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: product.id, qty: 1 });
  }
  saveCart();
}

function removeItem(productId) {
  const index = cart.findIndex((item) => item.id === productId);
  if (index > -1) {
    cart.splice(index, 1);
    saveCart();
  }
}

function clearCart() {
  cart = [];
  saveCart();
}

function getCartLines() {
  return cart
    .map((c) => ({ product: products.find((p) => p.id === c.id), qty: c.qty || 1 }))
    .filter((l) => l.product);
}

function setQty(productId, qty) {
  const item = cart.find((c) => c.id === productId);
  if (!item) return;
  if (qty < 1) return removeItem(productId);
  item.qty = qty;
  saveCart();
}

// Basket/cart overlay — products are loaded first so every page shows the same items
async function openBasketOverlay() {
  const existing = document.querySelector(".basket-overlay");
  if (existing) {
    existing.remove();
    return;
  }
  await loadProducts();

  const overlay = document.createElement("div");
  overlay.className = "basket-overlay";
  document.body.appendChild(overlay);

  const render = () => {
    const lines = getCartLines();
    const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
    overlay.innerHTML = `
      <div class="basket-content">
        <button class="basket-close" aria-label="Close basket">✕</button>
        <h2>Basket</h2>
        ${
          lines.length === 0
            ? '<p class="basket-empty">Your basket is empty.</p>'
            : `
          <div class="basket-items">
            ${lines
              .map(
                ({ product: p, qty }) => `
              <div class="basket-item">
                <div class="basket-item-image product-image-wrapper" style="aspect-ratio: 1;">
                  ${
                    p.imageSrc
                      ? `<img class="product-image" src="${p.imageSrc}" alt="${p.name}" loading="lazy" />`
                      : `<span class="product-image product-image--${p.imageClass}"></span>`
                  }
                </div>
                <div class="basket-item-info">
                  <span class="basket-item-name">${p.name}</span>
                  <span class="basket-item-qty">Qty ${qty}</span>
                  <span class="basket-item-price">${formatPrice(p.price * qty)}</span>
                  <a href="#" class="remove-item-link" data-product-id="${p.id}">Remove</a>
                </div>
              </div>`
              )
              .join("\n")}
          </div>
          <div class="basket-divider"></div>
          <div class="basket-totals">
            <div class="basket-total-row">
              <span>Subtotal</span>
              <span>${formatPrice(subtotal)}</span>
            </div>
          </div>
          <p class="basket-note">Free shipping on orders over $99.</p>
          <button class="btn btn-primary btn-checkout" style="width:100%; margin-top:16px;">Checkout →</button>
          <button class="btn btn-empty-basket" type="button" style="width:100%; margin-top:8px;">Empty basket</button>
        `
        }
      </div>
    `;
    overlay.querySelector(".basket-close").addEventListener("click", () => overlay.remove());
    overlay.querySelectorAll(".remove-item-link").forEach((link) =>
      link.addEventListener("click", (e) => {
        e.preventDefault();
        removeItem(link.dataset.productId);
        render();
      })
    );
    const checkoutBtn = overlay.querySelector(".btn-checkout");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        overlay.remove();
        window.location.href = "checkout.html";
      });
    }
    const emptyBtn = overlay.querySelector(".btn-empty-basket");
    if (emptyBtn) {
      emptyBtn.addEventListener("click", () => {
        clearCart();
        render();
      });
    }
  };

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  render();
}

// ---------- Checkout page ----------

const checkoutPage = document.querySelector(".checkout-page");

if (checkoutPage) {
  const checkoutHtml = checkoutPage.innerHTML; // keep the original layout so it can be restored
  const SHIPPING_FREE_THRESHOLD = 99;
  const SHIPPING_STANDARD = 9.99;
  const SHIPPING_EXPRESS = 19.99;

  const renderOrderSummary = () => {
    const lines = getCartLines();

    if (lines.length === 0) {
      checkoutPage.innerHTML = `
        <section class="checkout-hero">
          <h1>Checkout</h1>
          <p>Your basket is empty.</p>
        </section>
        <div style="text-align:center; padding:64px 24px;">
          <a href="index.html" class="btn btn-primary">Start shopping</a>
        </div>
      `;
      return;
    }

    if (!document.getElementById("order-items")) checkoutPage.innerHTML = checkoutHtml;

    const orderItemsEl = document.getElementById("order-items");
    orderItemsEl.innerHTML =
      lines
        .map(
          ({ product: p, qty }) => `
          <div class="order-item">
            <div class="order-item-image">
              ${
                p.imageSrc
                  ? `<img class="product-image" src="${p.imageSrc}" alt="${p.name}" loading="lazy" />`
                  : `<span class="product-image product-image--${p.imageClass}"></span>`
              }
            </div>
            <div class="order-item-info">
              <span class="order-item-name">${p.name}</span>
              <span class="order-item-meta">Qty ${qty} × ${formatPrice(p.price)}</span>
              <a href="#" class="remove-item-link" data-product-id="${p.id}">Remove</a>
            </div>
            <span>${formatPrice(p.price * qty)}</span>
          </div>`
        )
        .join("\n") +
      '<button class="btn btn-empty-basket" type="button" style="width:100%; margin-top:12px;">Empty basket</button>';

    const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
    const shippingEl = document.querySelector('input[name="shipping"]:checked');
    const shippingCost =
      subtotal >= SHIPPING_FREE_THRESHOLD
        ? 0
        : shippingEl && shippingEl.value === "express"
        ? SHIPPING_EXPRESS
        : SHIPPING_STANDARD;

    document.getElementById("summary-subtotal").textContent = formatPrice(subtotal);
    document.getElementById("summary-shipping").textContent =
      shippingCost === 0 ? "Free" : formatPrice(shippingCost);
    document.getElementById("summary-total").textContent = formatPrice(subtotal + shippingCost);

    orderItemsEl.querySelectorAll(".remove-item-link").forEach((link) =>
      link.addEventListener("click", (e) => {
        e.preventDefault();
        removeItem(link.dataset.productId);
        renderOrderSummary();
      })
    );
    orderItemsEl.querySelector(".btn-empty-basket").addEventListener("click", () => {
      clearCart();
      renderOrderSummary();
    });
    document.querySelectorAll('input[name="shipping"]').forEach((radio) => {
      radio.onchange = renderOrderSummary;
    });
  };

  loadProducts().then(() => {
    updateCartBadge();
    renderOrderSummary();
  });
}

// Make every page show the same basket count (products are not needed for the badge)
document.addEventListener("DOMContentLoaded", updateCartBadge);
updateCartBadge();

// Account toggle
function toggleAccount(link) {
  isLoggedIn = !isLoggedIn;
  const svg = link.querySelector("svg");
  const circle = svg.querySelector("circle");
  const path = svg.querySelector("path");

  if (isLoggedIn) {
    circle.setAttribute("fill", "currentColor");
    path.setAttribute("fill", "currentColor");
    link.setAttribute("aria-label", "Sign out");
  } else {
    circle.removeAttribute("fill");
    path.removeAttribute("fill");
    link.setAttribute("aria-label", "Account");
  }
}

// Wire up header actions
document.querySelectorAll(".header-link[data-action]").forEach((link) => {
  const action = link.dataset.action;
  link.addEventListener("click", (e) => {
    e.preventDefault();
    if (action === "search") openSearchOverlay();
    if (action === "account") toggleAccount(link);
    if (action === "wishlist") toggleWishlist(link);
    if (action === "basket") openBasketOverlay();
  });
});

loadProducts(); // preload on every page so search and basket work everywhere
