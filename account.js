/* Whimsy Workshop — customer accounts (static / no backend)
   Stores the shopper's details in this browser (for prefill + checkout). At checkout
   the details + order are emailed to the shop. For a real shared customer database,
   wire a form service (Netlify Forms / Formspree) on deploy. */
(function () {
  "use strict";
  var PKEY = "ww_customer";

  function get() { try { return JSON.parse(localStorage.getItem(PKEY)); } catch (e) { return null; } }
  function saveProfile(p) { try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {} }
  function isRegistered() { var p = get(); return !!(p && p.email); }

  var built = false, ov, onDone;
  var FIELDS = [
    ["firstName", "First name", "text", "wide-half"],
    ["lastName", "Last name", "text", "wide-half"],
    ["email", "Email", "email", "wide"],
    ["phone", "Phone (optional)", "tel", "wide"],
    ["address1", "Address", "text", "wide"],
    ["address2", "Apt / unit (optional)", "text", "wide"],
    ["city", "City", "text", ""],
    ["province", "Province / state", "text", ""],
    ["postal", "Postal / ZIP", "text", ""],
    ["country", "Country", "text", ""],
    ["notes", "Order notes (optional)", "textarea", "wide"],
  ];

  function build() {
    if (built) return; built = true;
    ov = document.createElement("div");
    ov.className = "ww-modal-ov";
    var inputs = FIELDS.map(function (f) {
      var cls = f[3] === "wide" ? " class=\"wide\"" : "";
      var ctrl = f[2] === "textarea"
        ? '<textarea data-k="' + f[0] + '"></textarea>'
        : '<input data-k="' + f[0] + '" type="' + f[2] + '">';
      return '<label' + cls + '>' + f[1] + ctrl + '</label>';
    }).join("");
    ov.innerHTML =
      '<div class="ww-modal" role="dialog" aria-modal="true">' +
        '<div class="ww-modal-head"><div><h2 id="wwAcctTitle">Your details</h2>' +
          '<p class="sub" id="wwAcctSub">So we know where to send your handmade treasures.</p></div>' +
          '<button class="ww-modal-x" aria-label="Close">&times;</button></div>' +
        '<div class="ww-form">' + inputs +
          '<p class="ww-hint">Saved only in your browser. Your details are sent to the workshop when you place an order.</p>' +
          '<div class="ww-modal-actions">' +
            '<button class="abtn" data-act="cancel" style="background:transparent;border:1px solid var(--mint-deep);">Cancel</button>' +
            '<button class="abtn primary" data-act="save">Save details</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    ov.querySelector(".ww-modal-x").onclick = close;
    ov.querySelector('[data-act="cancel"]').onclick = close;
    ov.querySelector('[data-act="save"]').onclick = submit;
  }

  function fill(p) {
    p = p || {};
    FIELDS.forEach(function (f) {
      var el = ov.querySelector('[data-k="' + f[0] + '"]');
      if (el) el.value = p[f[0]] || "";
    });
  }
  function read() {
    var out = {};
    FIELDS.forEach(function (f) {
      var el = ov.querySelector('[data-k="' + f[0] + '"]');
      out[f[0]] = el ? el.value.trim() : "";
    });
    return out;
  }

  function open(mode, cb) {
    build();
    onDone = cb || null;
    fill(get());
    var reg = mode === "register";
    ov.querySelector("#wwAcctTitle").textContent = reg ? "Register to order" : "Your details";
    ov.querySelector("#wwAcctSub").textContent = reg
      ? "A few details so we can pack and ship your order."
      : "Update your shipping details any time.";
    ov.classList.add("show");
    var first = ov.querySelector('[data-k="firstName"]'); if (first) first.focus();
  }
  function close() { if (ov) ov.classList.remove("show"); }

  function submit() {
    var p = read();
    if (!p.firstName || !p.lastName) { flash("Please add your name"); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email)) { flash("Please add a valid email"); return; }
    if (!p.address1 || !p.city) { flash("Please add your address"); return; }
    saveProfile(p);
    close();
    if (window.WWCart && WWCart.refreshAccount) WWCart.refreshAccount();
    if (onDone) { var cb = onDone; onDone = null; cb(p); }
  }
  function flash(msg) {
    var h = ov.querySelector(".ww-hint");
    h.textContent = msg; h.style.color = "var(--rose-deep)";
    setTimeout(function () { h.style.color = ""; h.textContent = "Saved only in your browser. Your details are sent to the workshop when you place an order."; }, 2600);
  }

  window.WWAccount = { get: get, open: open, isRegistered: isRegistered };
})();
