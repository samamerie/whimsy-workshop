/* Whimsy Workshop — create a Stripe Checkout session from the cart.
   The customer is redirected to Stripe's secure hosted payment page.
   Requires a Netlify environment variable:
     STRIPE_SECRET_KEY  — your Stripe secret key (starts with sk_live_ or sk_test_)
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

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { statusCode: 500, body: "Payments not configured (missing STRIPE_SECRET_KEY)" };

  let data;
  try { data = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, body: "Bad request" }; }

  const items = Array.isArray(data.items) ? data.items : [];
  if (!items.length) return { statusCode: 400, body: "Empty cart" };

  const origin = data.origin || `https://${event.headers.host}`;

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

  // shipping as a Stripe shipping option (our estimate; adjustable in Stripe later)
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
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: encodeForm(params).join("&"),
    });
    const session = await res.json();
    if (!res.ok) {
      return { statusCode: 502, body: (session.error && session.error.message) || "Stripe error" };
    }
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: session.url }) };
  } catch (e) {
    return { statusCode: 500, body: "Checkout error: " + (e && e.message) };
  }
};
