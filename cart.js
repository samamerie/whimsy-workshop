/* Whimsy Workshop — shared cart
   Persists to localStorage, injects a slide-out drawer + toast into any page.
   Usage on a page:
     <script src="cart.js"></script>
     Add buttons:  onclick="WWCart.add('Totoro Phone Charm', 12, '🌰', 'p3')"
     Cart button:  onclick="WWCart.open()"  with a badge <span data-cart-count>0</span>
   To enable real checkout later, fill in PAYMENT_LINKS below (Stripe Payment Links). */
(function () {
  "use strict";

  var KEY = "ww_cart";

  /* Map product name -> Stripe Payment Link URL. Empty for now. */
  var PAYMENT_LINKS = {
    // "Totoro Phone Charm": "https://buy.stripe.com/xxxxxxxx",
  };

  function money(n) {
    var v = Number(n).toFixed(2);
    return "$" + v.replace(/\.00$/, "");
  }
  function get() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  function save(c) {
    localStorage.setItem(KEY, JSON.stringify(c));
    updateBadges();
    renderDrawer();
  }
  function count() {
    return get().reduce(function (n, i) { return n + i.qty; }, 0);
  }
  function subtotal() {
    return get().reduce(function (s, i) { return s + i.price * i.qty; }, 0);
  }

  function add(name, price, emoji, tone, img) {
    var c = get();
    var row = c.find(function (i) { return i.name === name; });
    if (row) { row.qty += 1; }
    else { c.push({ name: name, price: Number(price) || 0, qty: 1, emoji: emoji || "✦", tone: tone || "p1", img: img || "" }); }
    save(c);
    toast(name + " added ✦");
    open();
  }
  function setQty(name, qty) {
    var c = get();
    var row = c.find(function (i) { return i.name === name; });
    if (!row) return;
    row.qty = qty;
    if (row.qty <= 0) c = c.filter(function (i) { return i.name !== name; });
    save(c);
  }
  function remove(name) {
    save(get().filter(function (i) { return i.name !== name; }));
  }

  /* ---- badges ---- */
  function updateBadges() {
    var n = count();
    document.querySelectorAll("[data-cart-count], #cartCount").forEach(function (el) {
      el.textContent = n;
    });
  }

  /* ---- drawer + toast injection ---- */
  var built = false, overlay, drawer, itemsEl, subtotalEl, shipLabelEl, shipAmtEl, grandEl, toastEl, tt;

  function build() {
    if (built) return;
    built = true;

    var css = document.createElement("style");
    css.textContent =
      ".ww-ov{position:fixed;inset:0;background:rgba(59,58,62,.42);opacity:0;pointer-events:none;transition:opacity .28s;z-index:120;}" +
      ".ww-ov.show{opacity:1;pointer-events:auto;}" +
      ".ww-dr{position:fixed;top:0;right:0;height:100%;width:min(400px,92vw);background:var(--cream,#FCFAF6);color:var(--ink,#3B3A3E);" +
        "box-shadow:-18px 0 50px -30px rgba(59,58,62,.6);transform:translateX(100%);transition:transform .32s cubic-bezier(.4,.14,.3,1);" +
        "z-index:121;display:flex;flex-direction:column;font-family:'Nunito',system-ui,sans-serif;}" +
      ".ww-dr.show{transform:translateX(0);}" +
      ".ww-dr h3{font-family:'Fraunces',serif;font-weight:500;font-size:1.3rem;margin:0;}" +
      ".ww-dr-head{display:flex;align-items:center;justify-content:space-between;padding:1.3rem 1.4rem;border-bottom:1px solid var(--mint-deep,#D7E7DB);}" +
      ".ww-x{background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--ink,#3B3A3E);line-height:1;}" +
      ".ww-items{flex:1;overflow-y:auto;padding:.6rem 1.4rem;}" +
      ".ww-row{display:flex;gap:.9rem;align-items:center;padding:1rem 0;border-bottom:1px solid var(--mint-deep,#D7E7DB);}" +
      ".ww-thumb{width:54px;height:54px;flex:0 0 auto;border-radius:14px;display:grid;place-items:center;font-size:1.5rem;}" +
      ".ww-p1{background:linear-gradient(135deg,#F7DCE0,#EBC9D2);}.ww-p2{background:linear-gradient(135deg,#DDE9DF,#C8DDcf);}" +
      ".ww-p3{background:linear-gradient(135deg,#F3E7D6,#E8D6BE);}.ww-p4{background:linear-gradient(135deg,#E5DDF0,#D3C7E6);}" +
      ".ww-p5{background:linear-gradient(135deg,#F8E0D2,#F0CBB6);}.ww-p6{background:linear-gradient(135deg,#D9E8EC,#C2DBE2);}" +
      ".ww-info{flex:1;min-width:0;}" +
      ".ww-info b{font-weight:700;font-size:.92rem;display:block;}" +
      ".ww-info .ww-price{color:var(--rose-deep,#C9787F);font-weight:700;font-size:.86rem;}" +
      ".ww-qty{display:inline-flex;align-items:center;gap:.5rem;margin-top:.4rem;}" +
      ".ww-qty button{width:24px;height:24px;border-radius:50%;border:1px solid var(--mint-deep,#D7E7DB);background:var(--mint,#E9F1EB);" +
        "cursor:pointer;font-weight:700;line-height:1;color:var(--ink,#3B3A3E);}" +
      ".ww-qty span{min-width:1.2rem;text-align:center;font-weight:700;font-size:.86rem;}" +
      ".ww-rm{background:none;border:none;color:var(--sage,#6F8A74);cursor:pointer;font-weight:700;font-size:.74rem;text-decoration:underline;}" +
      ".ww-empty{text-align:center;color:var(--sage,#6F8A74);font-weight:700;padding:3rem 1rem;}" +
      ".ww-foot{border-top:1px solid var(--mint-deep,#D7E7DB);padding:1.2rem 1.4rem 1.5rem;}" +
      ".ww-line{display:flex;justify-content:space-between;align-items:baseline;font-weight:700;font-size:.92rem;margin-bottom:.5rem;}" +
      ".ww-line.ship span:last-child{color:var(--sage,#6F8A74);}" +
      ".ww-grand{margin-top:.3rem;margin-bottom:1rem;padding-top:.6rem;border-top:1px dashed var(--mint-deep,#D7E7DB);}" +
      ".ww-grand .ww-total{font-family:'Fraunces',serif;font-weight:600;font-size:1.35rem;}" +
      ".ww-co{width:100%;background:var(--rose,#E29AA0);color:#fff;border:none;border-radius:999px;padding:.9rem;" +
        "font-family:'Nunito';font-weight:700;font-size:.98rem;cursor:pointer;transition:background .2s;}" +
      ".ww-co:hover{background:var(--rose-deep,#C9787F);}" +
      ".ww-note{text-align:center;color:var(--sage,#6F8A74);font-size:.76rem;font-weight:600;margin:.7rem 0 0;}" +
      ".ww-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--ink,#3B3A3E);color:#fff;" +
        "padding:.8rem 1.4rem;border-radius:999px;font-weight:700;font-size:.9rem;opacity:0;pointer-events:none;transition:.3s;z-index:130;font-family:'Nunito';}" +
      ".ww-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}";
    document.head.appendChild(css);

    overlay = el("div", "ww-ov");
    overlay.onclick = close;

    drawer = el("aside", "ww-dr");
    drawer.setAttribute("aria-label", "Shopping cart");
    drawer.innerHTML =
      '<div class="ww-dr-head"><h3>Your cart ✦</h3>' +
      '<button class="ww-x" aria-label="Close cart">&times;</button></div>' +
      '<div class="ww-items"></div>' +
      '<div class="ww-foot">' +
        '<div class="ww-line"><span>Subtotal</span><span id="ww-subtotal">$0</span></div>' +
        '<div class="ww-line ship"><span id="ww-ship-label">Shipping</span><span id="ww-ship-amt">—</span></div>' +
        '<div class="ww-line ww-grand"><span>Total</span><span class="ww-total" id="ww-grand">$0</span></div>' +
        '<button class="ww-co">Checkout</button>' +
        '<p class="ww-note">Handmade to order · ships across Canada</p>' +
      '</div>';

    toastEl = el("div", "ww-toast");

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    document.body.appendChild(toastEl);

    drawer.querySelector(".ww-x").onclick = close;
    drawer.querySelector(".ww-co").onclick = checkout;
    itemsEl = drawer.querySelector(".ww-items");
    subtotalEl = drawer.querySelector("#ww-subtotal");
    shipLabelEl = drawer.querySelector("#ww-ship-label");
    shipAmtEl = drawer.querySelector("#ww-ship-amt");
    grandEl = drawer.querySelector("#ww-grand");
  }

  /* ---- shipping estimate (Canada only) — edit rates here ---- */
  var CA_PROV = {
    "on":"ON","ontario":"ON","qc":"QC","quebec":"QC","québec":"QC","bc":"BC","british columbia":"BC",
    "ab":"AB","alberta":"AB","mb":"MB","manitoba":"MB","sk":"SK","saskatchewan":"SK",
    "ns":"NS","nova scotia":"NS","nb":"NB","new brunswick":"NB","pe":"PE","pei":"PE","prince edward island":"PE",
    "nl":"NL","newfoundland":"NL","newfoundland and labrador":"NL",
    "yt":"YT","yukon":"YT","nt":"NT","northwest territories":"NT","nu":"NU","nunavut":"NU"
  };
  function normProv(s) { if (!s) return ""; return CA_PROV[s.trim().toLowerCase()] || ""; }
  function shipRate() {
    var p = window.WWAccount ? WWAccount.get() : null;
    if (!p || !p.province && !p.country) return { none: true };
    var country = (p.country || "").trim().toLowerCase();
    if (country && country !== "canada" && country !== "ca") return { canadaOnly: true };
    var prov = normProv(p.province);
    if (prov === "ON") return { amount: 6, label: "ON" };
    if (prov === "YT" || prov === "NT" || prov === "NU") return { amount: 18, label: prov };
    if (prov) return { amount: 12, label: prov };
    return { amount: 12, label: "Canada" };
  }

  function el(tag, cls) { var e = document.createElement(tag); e.className = cls; return e; }

  function renderDrawer() {
    if (!built) return;
    var c = get();
    var sub = subtotal();
    subtotalEl.textContent = money(sub);
    var r = shipRate();
    if (!c.length) {
      shipLabelEl.textContent = "Shipping"; shipAmtEl.textContent = "—"; grandEl.textContent = money(0);
    } else if (r.none) {
      shipLabelEl.textContent = "Shipping"; shipAmtEl.textContent = "add address"; grandEl.textContent = money(sub);
    } else if (r.canadaOnly) {
      shipLabelEl.textContent = "Ships within Canada only"; shipAmtEl.textContent = ""; grandEl.textContent = money(sub);
    } else {
      shipLabelEl.textContent = "Shipping (est. " + r.label + ")"; shipAmtEl.textContent = money(r.amount);
      grandEl.textContent = money(sub + r.amount);
    }
    if (!c.length) {
      itemsEl.innerHTML = '<p class="ww-empty">Your cart is empty.<br>Go find a little treasure ✦</p>';
      return;
    }
    itemsEl.innerHTML = "";
    c.forEach(function (i) {
      var row = el("div", "ww-row");
      var thumb = i.img
        ? '<div class="ww-thumb" style="background-image:url(\'' + i.img + '\');background-size:cover;background-position:center;"></div>'
        : '<div class="ww-thumb ww-' + i.tone + '">' + i.emoji + '</div>';
      row.innerHTML =
        thumb +
        '<div class="ww-info"><b></b><span class="ww-price">' + money(i.price) + '</span>' +
          '<div class="ww-qty"><button class="ww-dec" aria-label="Decrease">–</button>' +
          '<span>' + i.qty + '</span><button class="ww-inc" aria-label="Increase">+</button>' +
          '<button class="ww-rm">remove</button></div></div>';
      row.querySelector("b").textContent = i.name;
      row.querySelector(".ww-dec").onclick = function () { setQty(i.name, i.qty - 1); };
      row.querySelector(".ww-inc").onclick = function () { setQty(i.name, i.qty + 1); };
      row.querySelector(".ww-rm").onclick = function () { remove(i.name); };
      itemsEl.appendChild(row);
    });
  }

  function open() { build(); renderDrawer(); overlay.classList.add("show"); drawer.classList.add("show"); }
  function close() { if (!built) return; overlay.classList.remove("show"); drawer.classList.remove("show"); }

  function toast(msg) {
    build();
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(tt);
    tt = setTimeout(function () { toastEl.classList.remove("show"); }, 1800);
  }

  var SHOP_EMAIL = "samamerie0@gmail.com";

  function checkout() {
    var c = get();
    if (!c.length) { toast("Your cart is empty ✦"); return; }
    if (isLocal()) {
      /* no payment backend locally — fall back to sending the order by email */
      if (window.WWAccount && !WWAccount.isRegistered()) {
        toast("Just need your details first ✦");
        WWAccount.open("register", function (profile) { placeOrder(c, profile); });
        return;
      }
      placeOrder(c, window.WWAccount ? WWAccount.get() : null);
      return;
    }
    startCheckout(c);
  }

  function startCheckout(items) {
    var r = shipRate();
    var p = window.WWAccount ? WWAccount.get() : null;
    var payload = {
      items: items.map(function (i) { return { name: i.name, price: i.price, qty: i.qty }; }),
      shipping: (r && r.amount != null) ? r.amount : 0,
      shippingLabel: (r && r.label) ? ("Shipping — est. " + r.label) : "Shipping",
      email: p ? p.email : "",
      origin: location.origin
    };
    toast("Taking you to secure checkout…");
    fetch("/.netlify/functions/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) return res.text().then(function (t) { throw new Error(t); });
      return res.json();
    }).then(function (d) {
      if (d && d.url) { window.location.href = d.url; }
      else { throw new Error("no url"); }
    }).catch(function () {
      toast("Couldn't reach card checkout — sending your order by email instead ✦");
      placeOrder(items, p);
    });
  }

  function isLocal() {
    var h = location.hostname;
    return location.protocol === "file:" || h === "localhost" || h === "127.0.0.1" || h === "";
  }

  function placeOrder(items, p) {
    var subN = subtotal();
    var r = shipRate();
    var shipN = (r && r.amount != null) ? r.amount : 0;
    var shipLabel = (r && r.amount != null) ? money(r.amount) + " (est. to " + r.label + ")"
      : (r && r.canadaOnly ? "within Canada only" : "TBD");
    var grand = subN + shipN;
    var addr = p ? [p.address1, p.address2, p.city, p.province, p.postal, p.country].filter(Boolean).join(", ") : "";
    var itemsText = items.map(function (i) { return i.qty + " x " + i.name + " (" + money(i.price * i.qty) + ")"; }).join("\n");
    try {
      var o = JSON.parse(localStorage.getItem("ww_orders")) || [];
      o.push({ at: new Date().toISOString(), subtotal: money(subN), shipping: shipLabel, total: money(grand), items: items, profile: p });
      localStorage.setItem("ww_orders", JSON.stringify(o));
    } catch (e) {}

    /* Live on Netlify → capture to the Forms dashboard. Local/preview → email fallback. */
    if (!isLocal()) {
      var fields = {
        "form-name": "orders",
        customer: p ? p.firstName + " " + p.lastName : "",
        email: p ? p.email : "",
        phone: p && p.phone ? p.phone : "",
        address: addr,
        items: itemsText,
        subtotal: money(subN),
        shipping: shipLabel,
        total: money(grand),
        notes: p && p.notes ? p.notes : ""
      };
      var body = Object.keys(fields).map(function (k) {
        return encodeURIComponent(k) + "=" + encodeURIComponent(fields[k]);
      }).join("&");
      fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body })
        .then(function (r2) {
          if (!r2.ok) throw new Error("form");
          save([]); close();
          toast("Order placed — we'll be in touch ✦");
        })
        .catch(function () { emailOrder(p, items, money(subN), shipLabel, money(grand), addr); });
    } else {
      emailOrder(p, items, money(subN), shipLabel, money(grand), addr);
    }
  }

  function emailOrder(p, items, subLabel, shipLabel, totalLabel, addr) {
    var lines = items.map(function (i) { return i.qty + " x " + i.name + " — " + money(i.price * i.qty); });
    var body = "New Whimsy Workshop order\n\nItems:\n" + lines.join("\n") +
      "\n\nSubtotal: " + subLabel +
      "\nShipping: " + shipLabel +
      "\nTotal: " + totalLabel + "\n\n" +
      "Customer: " + (p ? p.firstName + " " + p.lastName : "") + "\n" +
      "Email: " + (p ? p.email : "") + "\n" +
      "Phone: " + (p && p.phone ? p.phone : "—") + "\n" +
      "Ship to: " + addr + "\n" +
      (p && p.notes ? "Notes: " + p.notes + "\n" : "");
    toast("Opening your email to send the order ✦");
    window.location.href = "mailto:" + SHOP_EMAIL +
      "?subject=" + encodeURIComponent("New order — Whimsy Workshop") +
      "&body=" + encodeURIComponent(body);
  }
  function refreshAccount() { renderDrawer(); }

  /* keep count fresh if another tab changes the cart */
  window.addEventListener("storage", function (e) { if (e.key === KEY) { updateBadges(); renderDrawer(); } });

  document.addEventListener("DOMContentLoaded", function () { build(); updateBadges(); renderDrawer(); });

  window.WWCart = { add: add, remove: remove, setQty: setQty, open: open, close: close, count: count, subtotal: subtotal, refreshAccount: refreshAccount };
})();
