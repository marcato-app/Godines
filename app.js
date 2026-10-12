(() => {
  "use strict";

  // Número que recebe os pedidos (DDI + DDD + número, só dígitos)
  const WHATSAPP = "5511981972289";
  const STORAGE_KEY = "godines-carrinho-v1";
  const CUSTOMER_KEY = "godines-cliente-v1";

  // Cardápio 2025
  const MENU = [
    {
      id: "salgadas",
      name: "Esfihas Salgadas",
      items: [
        ["Alho", 9.0], ["Atum", 10.0], ["Atum com Catupiry", 11.0], ["Atum com Queijo", 10.5],
        ["Bacon", 9.5], ["Bacon com Catupiry", 10.5], ["Bacon com Cheddar", 10.5], ["Baiana", 9.0],
        ["Brócolis", 9.5], ["Brócolis com Catupiry", 10.5], ["Brócolis com Cheddar", 10.5],
        ["Calabresa", 9.0], ["Calabresa com Catupiry", 10.5], ["Calabresa com Cheddar", 10.5], ["Calabresa com Queijo", 10.0],
        ["Carne", 9.0], ["Carne com Catupiry", 10.5], ["Carne com Cheddar", 10.5], ["Carne com Queijo", 10.0],
        ["Catupiry", 9.0], ["Cheddar", 9.0], ["Cheddar com Bacon", 10.5], ["Dois Queijos", 10.0],
        ["Escarola", 9.5], ["Escarola com Catupiry", 10.5],
        ["Frango", 9.0], ["Frango com Catupiry", 10.5], ["Frango com Cheddar", 10.5], ["Frango com Queijo", 10.0],
        ["Godinês", 11.5, "Especial da casa"],
        ["Lombo", 10.0], ["Lombo com Catupiry", 10.5], ["Milho", 9.5], ["Milho com Catupiry", 10.5],
        ["Palmito", 10.5], ["Palmito com Catupiry", 11.5], ["Pepperoni", 10.5], ["Pepperoni com Catupiry", 11.0],
        ["Presunto", 9.5], ["Presunto com Catupiry", 10.5], ["Provolone", 9.5], ["Provolone com Catupiry", 10.5],
        ["Queijo", 9.0], ["Três Queijos", 11.0], ["Quatro Queijos", 11.5],
      ],
    },
    {
      id: "doces",
      name: "Esfihas Doces",
      items: [
        ["Banana", 10.0], ["Banana com Chocolate", 9.5], ["Beijinho", 9.0], ["Brigadeiro", 9.0],
        ["Chocolate", 8.5], ["Chocolate Branco", 9.0], ["Doce de Leite", 8.5], ["Kit Kat", 10.5],
        ["M&M's", 10.5], ["Ouro Branco", 10.5], ["Ovomaltine", 10.0], ["Prestígio", 10.0],
        ["Romeu e Julieta", 9.5], ["Sonho de Valsa", 10.5],
      ],
    },
    {
      id: "kibes",
      name: "Kibes",
      items: [["Tradicional", 9.0], ["Catupiry", 9.0], ["Queijo", 9.0]],
    },
  ];

  // Índice de produtos por id
  const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const PRODUCTS = new Map();
  MENU.forEach((cat) => {
    cat.items = cat.items.map(([name, price, tag]) => {
      const p = { id: `${cat.id}-${slug(name)}`, name, price, tag, cat: cat.name };
      PRODUCTS.set(p.id, p);
      return p;
    });
  });

  // ---------- Ilustrações dos sabores (SVG gerado) ----------
  const hash = (str) => { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (seed) => () => ((seed = Math.imul(seed ^ (seed >>> 15), 2246822507) ^ Math.imul(seed ^ (seed >>> 13), 3266489909)) >>> 0) / 4294967296;

  // [palavra-chave, cor, estilo]
  const TOPPINGS = [
    ["godines", "#8A3B1F", "crumb"], ["quatro queijos", "#F6C945", "melt"], ["tres queijos", "#F6C945", "melt"],
    ["dois queijos", "#F6C945", "melt"], ["calabresa", "#B5332A", "slice"], ["pepperoni", "#A82A24", "slice"],
    ["baiana", "#B8401F", "crumb"], ["carne", "#7E3A1E", "crumb"], ["frango", "#E2B66E", "shred"],
    ["bacon", "#B4492F", "strip"], ["atum", "#C69C78", "shred"], ["brocolis", "#3F7F35", "leaf"],
    ["escarola", "#4E8A3A", "leaf"], ["milho", "#F2C531", "corn"], ["palmito", "#EFE3C2", "ring"],
    ["presunto", "#E59A8B", "strip"], ["lombo", "#D9907C", "strip"], ["provolone", "#F1C04B", "melt"],
    ["alho", "#FFF6E0", "crumb"], ["cheddar", "#F39C1F", "melt"], ["catupiry", "#FFF8EC", "melt"], ["queijo", "#F6C945", "melt"],
    // doces
    ["chocolate branco", "#F3E7D3", "melt"], ["romeu", "#F6D27A", "guava"], ["banana", "#F2D16B", "banana"],
    ["beijinho", "#FFF8EC", "coco"], ["prestigio", "#5A2E1A", "coco"], ["m-m-s", "#5A2E1A", "candy"],
    ["doce de leite", "#C98A3E", "melt"], ["kit-kat", "#5A2E1A", "bar"], ["ouro branco", "#5A2E1A", "bonbon"],
    ["sonho de valsa", "#5A2E1A", "bonbon"], ["ovomaltine", "#6B3A1F", "crumbW"], ["brigadeiro", "#4E2716", "sprinkle"],
    ["chocolate", "#5A2E1A", "melt"],
  ];

  function thumb(p, catId) {
    const key = slug(p.name);
    const r = rng(hash(p.id));
    const dots = (n, rad, fn) => Array.from({ length: n }, () => {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad;
      return fn(50 + Math.cos(a) * d, 52 + Math.sin(a) * d * 0.92, r());
    }).join("");

    if (catId === "kibes") {
      const fill = key.includes("catupiry") ? "#FFF8EC" : key.includes("queijo") ? "#F6C945" : null;
      return `<svg viewBox="0 0 100 100" aria-hidden="true">
        <ellipse cx="50" cy="78" rx="34" ry="5" fill="#000" opacity=".08"/>
        <path d="M14 56 Q50 22 86 56 Q50 82 14 56Z" fill="#8B4A22"/>
        <path d="M18 55 Q50 28 82 55 Q50 76 18 55Z" fill="#A65A2A"/>
        ${dots(22, 22, (x, y) => `<circle cx="${x.toFixed(1)}" cy="${(y - 1).toFixed(1)}" r="1.1" fill="#6E3615" opacity=".8"/>`)}
        <path d="M24 50 Q50 34 76 50" stroke="#C47A3E" stroke-width="2" fill="none" opacity=".6" stroke-linecap="round"/>
        ${fill ? `<path d="M70 52 q8 -2 10 3 q-4 6 -12 4 q4 -3 2 -7z" fill="${fill}" stroke="#E2C27A" stroke-width=".8"/>` : ""}
      </svg>`;
    }

    const t = TOPPINGS.find(([k]) => key.includes(k.replace(/ /g, "-"))) || ["", "#F6C945", "melt"];
    const [, color, style] = t;
    const extraCatupiry = key.includes("com-catupiry") && style !== "melt";
    const extraCheddar = key.includes("com-cheddar") && t[0] !== "cheddar";
    const extraQueijo = key.includes("com-queijo");
    let top = "";
    switch (style) {
      case "melt":
        top = `<circle cx="50" cy="52" r="27" fill="${color}"/>` + dots(7, 18, (x, y, k) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(4 + k * 4).toFixed(1)}" fill="#fff" opacity=".22"/>`);
        break;
      case "crumb":
        top = `<circle cx="50" cy="52" r="27" fill="${color}" opacity=".35"/>` + dots(46, 25, (x, y, k) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.6 + k * 2).toFixed(1)}" fill="${color}"/>`);
        if (key.includes("godines")) top += dots(8, 20, (x, y) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#F6C945"/>`) + dots(6, 20, (x, y) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2" fill="#3F7F35"/>`);
        if (key === "alho") top = `<circle cx="50" cy="52" r="27" fill="#F2D27E"/>` + dots(26, 24, (x, y) => `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="2.6" ry="1.6" fill="#FFF6E0"/>`) + dots(10, 22, (x, y) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1" fill="#3F7F35"/>`);
        break;
      case "slice":
        top = `<circle cx="50" cy="52" r="27" fill="#F6C945" opacity=".8"/>` + [[40, 42], [60, 44], [50, 58], [36, 60], [64, 61]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.5" fill="${color}"/><circle cx="${x}" cy="${y}" r="7.5" fill="none" stroke="#7A1A15" stroke-width="1"/><circle cx="${x - 2}" cy="${y - 2}" r="1.3" fill="#F6E1C6" opacity=".8"/><circle cx="${x + 2.5}" cy="${y + 1.5}" r="1" fill="#F6E1C6" opacity=".8"/>`).join("");
        break;
      case "shred":
        top = `<circle cx="50" cy="52" r="27" fill="${color}" opacity=".45"/>` + dots(22, 23, (x, y, k) => `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="7" height="2.6" rx="1.3" fill="${color}" transform="rotate(${(k * 180).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
        break;
      case "strip":
        top = `<circle cx="50" cy="52" r="27" fill="#F6C945" opacity=".7"/>` + dots(9, 20, (x, y, k) => `<rect x="${(x - 6).toFixed(1)}" y="${(y - 2.5).toFixed(1)}" width="12" height="5" rx="2" fill="${color}" transform="rotate(${(k * 180).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
        break;
      case "leaf":
        top = `<circle cx="50" cy="52" r="27" fill="#F6E7B8"/>` + dots(12, 21, (x, y) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="${color}"/><circle cx="${(x + 2).toFixed(1)}" cy="${(y - 2).toFixed(1)}" r="2.6" fill="#6BA34E"/>`);
        break;
      case "corn":
        top = `<circle cx="50" cy="52" r="27" fill="#F6E7B8"/>` + dots(30, 24, (x, y) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="${color}" stroke="#D9A514" stroke-width=".6"/>`);
        break;
      case "ring":
        top = `<circle cx="50" cy="52" r="27" fill="#F6E7B8"/>` + dots(9, 20, (x, y) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${color}" stroke="#D8C79A" stroke-width="1.2"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.8" fill="#D8C79A"/>`);
        break;
      case "guava":
        top = `<circle cx="50" cy="52" r="27" fill="${color}"/>` + dots(6, 18, (x, y, k) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(4 + k * 3).toFixed(1)}" fill="#B8323A"/>`);
        break;
      case "banana":
        top = `<circle cx="50" cy="52" r="27" fill="#E8C48C"/>` + [[40, 44], [58, 42], [50, 58], [64, 58], [36, 58]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${color}" stroke="#E0B54A" stroke-width="1"/><circle cx="${x}" cy="${y}" r="2" fill="#D9A93A" opacity=".6"/>`).join("") + (key.includes("chocolate") ? `<path d="M30 40 q20 10 40 0 M30 55 q20 10 40 0" stroke="#5A2E1A" stroke-width="3" fill="none" stroke-linecap="round"/>` : "");
        break;
      case "coco":
        top = `<circle cx="50" cy="52" r="27" fill="${color}"/>` + dots(40, 24, (x, y, k) => `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="3.4" height="1.4" rx=".7" fill="#FFFDF7" transform="rotate(${(k * 180).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
        break;
      case "candy": {
        const cs = ["#E53935", "#FDD835", "#43A047", "#1E88E5", "#FB8C00", "#8E24AA"];
        top = `<circle cx="50" cy="52" r="27" fill="${color}"/>` + dots(14, 21, (x, y, k) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="${cs[Math.floor(k * cs.length)]}"/>`);
        break;
      }
      case "bar":
        top = `<circle cx="50" cy="52" r="27" fill="${color}"/>` + [[36, 40], [52, 46], [40, 58]].map(([x, y]) => `<rect x="${x}" y="${y}" width="16" height="6" rx="1.5" fill="#C98A3E" stroke="#8A5520" stroke-width=".8"/>`).join("");
        break;
      case "bonbon":
        top = `<circle cx="50" cy="52" r="27" fill="${color}"/>` + [[40, 44], [60, 46], [50, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#7A4424"/><circle cx="${x - 1.5}" cy="${y - 1.5}" r="2" fill="#B07A4C"/>`).join("") + dots(10, 22, (x, y) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.2" fill="${key.includes("ouro") ? "#FFF6E0" : "#C98A3E"}"/>`);
        break;
      case "crumbW":
        top = `<circle cx="50" cy="52" r="27" fill="#5A2E1A"/>` + dots(30, 24, (x, y, k) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.4 + k * 1.6).toFixed(1)}" fill="${color === "#6B3A1F" ? "#C99A62" : color}"/>`);
        break;
      case "sprinkle":
        top = `<circle cx="50" cy="52" r="27" fill="${color}"/>` + dots(50, 24, (x, y, k) => `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="3" height="1.3" rx=".6" fill="#2A120A" transform="rotate(${(k * 180).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
        break;
    }
    if (extraCatupiry) top += dots(5, 16, (x, y, k) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(4 + k * 3).toFixed(1)}" fill="#FFF8EC" stroke="#EFE0C4" stroke-width=".8"/>`);
    if (extraCheddar) top += dots(5, 16, (x, y, k) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(4 + k * 3).toFixed(1)}" fill="#F39C1F"/>`);
    if (extraQueijo) top += dots(6, 18, (x, y, k) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(3.5 + k * 3).toFixed(1)}" fill="#F6C945" opacity=".95"/>`);

    return `<svg viewBox="0 0 100 100" aria-hidden="true">
      <ellipse cx="50" cy="84" rx="34" ry="5" fill="#000" opacity=".08"/>
      <circle cx="50" cy="54" r="38" fill="#C9822F"/>
      <circle cx="50" cy="52" r="38" fill="#E8A852"/>
      <circle cx="50" cy="52" r="32" fill="#F3C47A"/>
      <path d="M22 40 a32 32 0 0 1 22 -18" stroke="#FCE3B4" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
      <g>${top}</g>
    </svg>`;
  }

  const describe = (p, catId) => {
    if (catId === "kibes") return p.name === "Tradicional" ? "Kibe frito" : "Kibe recheado";
    if (catId === "doces") return "Esfiha doce";
    if (p.name === "Godinês") return "Receita especial da casa";
    return "Esfiha aberta";
  };

  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const store = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* sem storage */ } },
  };

  // ---------- Carrinho ----------
  let cart = store.get(STORAGE_KEY, {});
  Object.keys(cart).forEach((id) => { if (!PRODUCTS.has(id) || !(cart[id] > 0)) delete cart[id]; });

  const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = () => Object.entries(cart).reduce((a, [id, q]) => a + PRODUCTS.get(id).price * q, 0);

  function setQty(id, qty) {
    const before = cart[id] || 0;
    qty = Math.max(0, Math.min(99, qty));
    if (qty === 0) delete cart[id]; else cart[id] = qty;
    store.set(STORAGE_KEY, cart);
    renderAll();
    if (qty > before) {
      toast(`${PRODUCTS.get(id).name} · adicionado à sacola`);
      const badge = $("[data-cart-count]");
      badge.classList.remove("bump"); void badge.offsetWidth; badge.classList.add("bump");
    }
  }

  const ICON_PLUS = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 5v14M5 12h14"/></svg>';
  const ICON_MINUS = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M5 12h14"/></svg>';
  const qtyControl = (id, q, name = "") => q > 0
    ? `<div class="stepper" data-id="${id}">
         <button type="button" data-act="dec" aria-label="Remover um ${esc(name)}">${ICON_MINUS}</button>
         <output aria-live="polite">${q}</output>
         <button type="button" data-act="inc" aria-label="Adicionar mais um ${esc(name)}">${ICON_PLUS}</button>
       </div>`
    : `<button type="button" class="add" data-id="${id}" data-act="inc" aria-label="Adicionar ${esc(name)}">${ICON_PLUS}</button>`;

  // ---------- Cardápio ----------
  const menuEl = $("[data-menu]");
  const tabsEl = $("[data-tabs]");

  function renderMenu() {
    tabsEl.innerHTML = MENU.map((c, i) => `<button type="button" class="tab${i === 0 ? " is-active" : ""}" data-target="${c.id}">${c.name}</button>`).join("");
    menuEl.innerHTML = MENU.map((c) => `
      <section class="cat" id="${c.id}" data-cat>
        <header class="cat__head">
          <h3 class="cat__title">${c.name}</h3>
          <span class="cat__count">${c.items.length} ${c.items.length === 1 ? "sabor" : "sabores"}</span>
        </header>
        <ul class="dishes">
          ${c.items.map((p) => `
            <li class="dish" data-item="${p.id}" data-search-text="${esc(slug(p.name + " " + c.name))}">
              ${p.tag ? `<span class="dish__tag">${esc(p.tag)}</span>` : ""}
              <div class="dish__img">${thumb(p, c.id)}</div>
              <div class="dish__body">
                <h4 class="dish__name">${esc(p.name)}</h4>
                <p class="dish__desc">${esc(describe(p, c.id))}</p>
                <span class="dish__price">${brl(p.price)}</span>
              </div>
              <div class="dish__ctrl"></div>
            </li>`).join("")}
        </ul>
      </section>`).join("");
  }

  function renderFeatured() {
    const p = PRODUCTS.get("salgadas-godines");
    $("[data-featured]").innerHTML = `
      <article class="featured" data-item="${p.id}">
        <div>
          <p class="eyebrow">Especial da casa</p>
          <h2>Esfiha Godinês</h2>
          <p>A receita que leva o nome da casa. Experimente junto com o seu pedido.</p>
          <div class="featured__row">
            <span class="featured__price">${brl(p.price)}</span>
            <div class="dish__ctrl"></div>
          </div>
        </div>
        <div class="featured__img">${thumb(p, "salgadas")}</div>
      </article>`;
  }

  function updateMenuControls() {
    $$("[data-item]").forEach((el) => {
      const id = el.dataset.item;
      const q = cart[id] || 0;
      el.classList.toggle("in-cart", q > 0);
      const ctrl = $(".dish__ctrl", el);
      if (ctrl.dataset.q === String(q)) return;
      const out = $("output", ctrl);
      if (out && q > 0 && ctrl.dataset.q !== "0") out.textContent = q; // mantém o foco no botão
      else ctrl.innerHTML = qtyControl(id, q, PRODUCTS.get(id).name);
      ctrl.dataset.q = q;
    });
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const id = btn.dataset.id || btn.closest("[data-id]")?.dataset.id;
    if (!id) return;
    setQty(id, (cart[id] || 0) + (btn.dataset.act === "inc" ? 1 : -1));
  });

  tabsEl.addEventListener("click", (e) => {
    const t = e.target.closest(".tab");
    if (!t) return;
    $("#" + t.dataset.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Destaca a aba da categoria visível
  function syncTabs() {
    const offset = $("[data-menubar]").getBoundingClientRect().bottom + 24;
    let active = MENU[0].id;
    $$("[data-cat]").forEach((s) => { if (!s.hidden && s.getBoundingClientRect().top <= offset) active = s.id; });
    $$(".tab", tabsEl).forEach((t) => {
      const on = t.dataset.target === active;
      if (on && !t.classList.contains("is-active")) t.scrollIntoView({ inline: "center", block: "nearest" });
      t.classList.toggle("is-active", on);
    });
  }
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { syncTabs(); ticking = false; });
  }, { passive: true });

  // Busca
  $("[data-search]").addEventListener("input", (e) => {
    const q = slug(e.target.value);
    let any = false;
    $$("[data-cat]").forEach((sec) => {
      let n = 0;
      $$("[data-item]", sec).forEach((it) => {
        const show = !q || it.dataset.searchText.includes(q);
        it.hidden = !show;
        if (show) n++;
      });
      sec.hidden = n === 0;
      if (n) any = true;
    });
    $("[data-empty]").hidden = any;
    $("[data-featured]").hidden = !!q;
  });

  // ---------- Drawer ----------
  const drawer = $("[data-drawer]");
  let lastFocus = null;
  function openCart() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    document.body.classList.add("no-scroll");
    $(".icon-btn", drawer).focus();
  }
  function closeCart() {
    drawer.hidden = true;
    document.body.classList.remove("no-scroll");
    lastFocus?.focus?.();
  }
  $$("[data-open-cart]").forEach((b) => b.addEventListener("click", openCart));
  $$("[data-close-cart]").forEach((b) => b.addEventListener("click", closeCart));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !drawer.hidden) closeCart(); });

  function renderCart() {
    const ids = Object.keys(cart);
    const count = cartCount();
    const total = cartTotal();
    $("[data-cart-items]").innerHTML = ids.map((id) => {
      const p = PRODUCTS.get(id);
      return `<li class="line">
        <div class="line__info">
          <p class="line__name">${esc(p.name)}</p>
          <p class="line__meta">${brl(p.price)} / un.</p>
        </div>
        ${qtyControl(id, cart[id], p.name)}
        <span class="line__sum">${brl(p.price * cart[id])}</span>
      </li>`;
    }).join("");
    $("[data-cart-empty]").hidden = ids.length > 0;
    $("[data-cart-filled]").hidden = ids.length === 0;
    $("[data-cart-foot]").hidden = ids.length === 0;
    $("[data-send]").disabled = ids.length === 0;
    $("[data-cart-total]").textContent = brl(total);

    const badge = $("[data-cart-count]");
    badge.textContent = count;
    badge.hidden = count === 0;
    const bar = $("[data-cartbar]");
    bar.hidden = count === 0;
    $("[data-cartbar-count]").textContent = count;
    $("[data-cartbar-total]").textContent = brl(total);
  }

  function renderAll() { updateMenuControls(); renderCart(); }

  // ---------- Formulário ----------
  const form = $("[data-checkout]");
  const addressBox = $("[data-address]");
  const trocoBox = $("[data-troco]");

  // Restaura dados do cliente de pedidos anteriores
  const saved = store.get(CUSTOMER_KEY, {});
  ["nome", "telefone", "rua", "numero", "bairro", "complemento"].forEach((k) => { if (saved[k]) form.elements[k].value = saved[k]; });
  if (saved.tipo) $$(`input[name="tipo"]`, form).forEach((r) => { r.checked = r.value === saved.tipo; });

  function syncForm() {
    const delivery = form.elements.tipo.value === "Entrega";
    addressBox.hidden = !delivery;
    $$("input[required]", addressBox).forEach((i) => { i.disabled = !delivery; });
    $("[data-pickup]").hidden = delivery;
    $("[data-fee-note]").hidden = !delivery;
    trocoBox.hidden = form.elements.pagamento.value !== "Dinheiro";
  }
  form.addEventListener("change", syncForm);
  syncForm();

  // Máscara de telefone
  form.elements.telefone.addEventListener("input", (e) => {
    const d = e.target.value.replace(/\D/g, "").slice(0, 11);
    let out = d;
    if (d.length > 2) out = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length > 7) out = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
    e.target.value = out;
  });

  form.addEventListener("input", (e) => e.target.classList?.remove("invalid"));

  function validate() {
    const errors = [];
    $$("input.invalid", form).forEach((i) => i.classList.remove("invalid"));
    $(".pay", form).classList.remove("invalid");
    const need = (name, label) => {
      const el = form.elements[name];
      if (!el.disabled && !el.value.trim()) { el.classList.add("invalid"); errors.push(label); }
    };
    need("nome", "nome");
    need("telefone", "telefone");
    if (form.elements.telefone.value && form.elements.telefone.value.replace(/\D/g, "").length < 10) {
      form.elements.telefone.classList.add("invalid"); errors.push("telefone válido");
    }
    need("rua", "rua");
    need("numero", "número");
    need("bairro", "bairro");
    if (!form.elements.pagamento.value) { $(".pay", form).classList.add("invalid"); errors.push("forma de pagamento"); }
    return [...new Set(errors)];
  }

  function buildMessage() {
    const f = form.elements;
    const delivery = f.tipo.value === "Entrega";
    const lines = [];
    lines.push("*NOVO PEDIDO — GODINÊS ESFIHARIA*", "");
    lines.push(`*Nome:* ${f.nome.value.trim()}`);
    lines.push(`*Telefone:* ${f.telefone.value.trim()}`);
    if (delivery) {
      let end = `${f.rua.value.trim()}, ${f.numero.value.trim()} — ${f.bairro.value.trim()}`;
      if (f.complemento.value.trim()) end += ` (${f.complemento.value.trim()})`;
      lines.push(`*Endereço:* ${end}`);
    } else {
      lines.push("*Endereço:* Retirada no local");
    }
    lines.push("", "*PEDIDO:*");
    MENU.forEach((cat) => {
      const its = cat.items.filter((p) => cart[p.id]);
      if (!its.length) return;
      lines.push(`_${cat.name}_`);
      its.forEach((p) => lines.push(`• ${cart[p.id]}x ${p.name} — ${brl(p.price * cart[p.id])}`));
    });
    if (f.obs.value.trim()) lines.push("", `*Observações:* ${f.obs.value.trim()}`);
    lines.push("", `*Total:* ${brl(cartTotal())}${delivery ? " (+ taxa de entrega, se houver)" : ""}`);
    let pay = f.pagamento.value;
    if (pay === "Dinheiro" && f.troco.value.trim()) {
      const v = parseFloat(f.troco.value.replace(/[^\d,.]/g, "").replace(",", "."));
      pay += isNaN(v) ? ` — troco para ${f.troco.value.trim()}` : ` — troco para ${brl(v)}`;
    } else if (pay === "Dinheiro") {
      pay += " — sem troco";
    }
    lines.push(`*Forma de pagamento:* ${pay}`);
    return lines.join("\n");
  }

  $("[data-send]").addEventListener("click", () => {
    if (!cartCount()) return;
    const errors = validate();
    const errEl = $("[data-form-error]");
    if (errors.length) {
      errEl.textContent = `Preencha: ${errors.join(", ")}.`;
      errEl.hidden = false;
      (form.querySelector(".invalid input, input.invalid") || errEl).scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    errEl.hidden = true;

    const f = form.elements;
    store.set(CUSTOMER_KEY, {
      nome: f.nome.value, telefone: f.telefone.value, rua: f.rua.value, numero: f.numero.value,
      bairro: f.bairro.value, complemento: f.complemento.value, tipo: f.tipo.value,
    });

    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(buildMessage())}`;
    const win = window.open(url, "_blank");
    if (!win) location.href = url;
  });

  // ---------- Toast ----------
  let toastTimer;
  function toast(msg) {
    const t = $("[data-toast]");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1400);
  }

  // ---------- Navegação e animações ----------
  const nav = $("[data-nav]");
  const syncNav = () => nav.classList.toggle("is-solid", window.scrollY > 120);
  window.addEventListener("scroll", syncNav, { passive: true });
  syncNav();

  $("[data-year]").textContent = new Date().getFullYear();

  renderFeatured();
  renderMenu();
  renderAll();

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach((el) => io.observe(el));
  } else {
    $$(".reveal").forEach((el) => el.classList.add("is-in"));
  }
})();
