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
        <header class="cat__head reveal">
          <h3 class="cat__title">${c.name}</h3>
          <span class="cat__count">${c.items.length} ${c.items.length === 1 ? "sabor" : "sabores"}</span>
        </header>
        <ul class="dishes">
          ${c.items.map((p) => `
            <li class="dish" data-item="${p.id}" data-search-text="${esc(slug(p.name + " " + c.name))}">
              <div class="dish__line">
                <span class="dish__name">${esc(p.name)}${p.tag ? `<span class="dish__tag">${esc(p.tag)}</span>` : ""}</span>
                <span class="dish__dots" aria-hidden="true"></span>
                <span class="dish__price">${brl(p.price)}</span>
              </div>
              <div class="dish__ctrl"></div>
            </li>`).join("")}
        </ul>
      </section>`).join("");
  }

  function updateMenuControls() {
    $$("[data-item]", menuEl).forEach((el) => {
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
  const syncNav = () => nav.classList.toggle("is-solid", window.scrollY > 24);
  window.addEventListener("scroll", syncNav, { passive: true });
  syncNav();

  $("[data-year]").textContent = new Date().getFullYear();

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
