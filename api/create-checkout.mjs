/* Whimsy Workshop — create a Stripe Checkout session from the cart (Vercel function).
   The customer is redirected to Stripe's secure hosted payment page.
   Requires a Vercel environment variable:
     STRIPE_SECRET_KEY  — your Stripe secret key (sk_test_… while testing, sk_live_… when live)
*/
function encodeForm(obj, prefix, out) {
  out = out || [];
  for (const k in obj) {
    const key = prefix ? `${prefix}[${k}]` : k;
    const v = obj[k];
    if (v === undefined || v === null) continue;
    if (typeof v === "object") encodeForm(v, key, out);
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).send("Method not allowed"); return; }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) { res.status(500).send("Payments not configured (missing STRIPE_SECRET_KEY)"); return; }

  let data = req.body;
  if (typeof data === "string") { try { data = JSON.parse(data); } catch { data = {}; } }
  data = data || {};

  const items = Array.isArray(data.items) ? data.items : [];
  if (!items.length) { res.status(400).send("Empty cart"); return; }

  const origin = data.origin || ("https://" + (req.headers.host || ""));

  const line_items = items.map((i) => ({
    price_data: {
      currency: "cad",
      product_data: { name: String(i.name || "Item").slice(0, 250) },
      unit_amount: Math.max(0, Math.round(Number(i.price) * 100)),
    },
    quantity: Math.max(1, parseInt(i.qty, 10) || 1),
  }));

  const params = {
    mode: "payment",
    success_url: `${origin}/thank-you.html?paid=1`,
    cancel_url: `${origin}/shop.html`,
    line_items,
    shipping_address_collection: { allowed_countries: ["CA"] },
    phone_number_collection: { enabled: true },
    submit_type: "pay",
    billing_address_collection: "auto",
  };
  if (data.email) params.customer_email = String(data.email).slice(0, 250);

  const ship = Math.round(Number(data.shipping) * 100);
  if (ship > 0) {
    params.shipping_options = [{
      shipping_rate_data: {
        type: "fixed_amount",
        fixed_amount: { amount: ship, currency: "cad" },
        display_name: data.shippingLabel || "Shipping",
      },
    }];
  }

  try {
    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: encodeForm(params).join("&"),
    });
    const session = await r.json();
    if (!r.ok) { res.status(502).send((session.error && session.error.message) || "Stripe error"); return; }
    res.status(200).json({ url: session.url });
  } catch (e) {
    res.status(500).send("Checkout error: " + (e && e.message));
  }
}
