/* Whimsy Workshop — newsletter signup (Vercel function).
   Stores emails privately in Vercel KV / Upstash Redis (a set, so duplicates are ignored).
   Needs a KV store connected to the project — Vercel adds these automatically:
     KV_REST_API_URL + KV_REST_API_TOKEN   (or UPSTASH_REDIS_REST_URL/TOKEN)
   See NEWSLETTER-SETUP.md.
*/
export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).send("Method not allowed"); return; }

  let data = req.body;
  if (typeof data === "string") { try { data = JSON.parse(data); } catch { data = {}; } }
  data = data || {};

  const email = String(data.email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { res.status(400).send("Invalid email"); return; }

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) { res.status(500).send("Newsletter storage not set up yet"); return; }

  try {
    const r = await fetch(`${url}/sadd/ww_subscribers/${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) { res.status(502).send("Store error"); return; }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).send("Error: " + (e && e.message));
  }
}
