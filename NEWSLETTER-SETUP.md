# Newsletter — one-time setup (private email storage)

The footer "Join" box collects emails. They're stored **privately** in a Vercel KV
(Redis) store — customer emails must never go in your public code, so this needs a
small storage add. ~5 clicks, free tier is plenty.

## Steps
1. **Vercel** → your project → **Storage** tab → **Create Database**.
2. Choose **KV / Upstash (Redis)** → give it a name (e.g. `whimsy-subscribers`) → **Create**.
3. When it asks, **Connect** it to the `whimsy-workshop` project (all environments).
   - This automatically adds the needed environment variables
     (`KV_REST_API_URL` and `KV_REST_API_TOKEN`) — you don't copy anything.
4. **Deployments → latest → ⋯ → Redeploy** so the function picks them up.

That's it — the "Join" box now saves emails.

## Seeing your subscribers
- Vercel → **Storage** → your KV database → **Data Browser** (or the CLI) → look at the
  set **`ww_subscribers`**. Each email is one entry (duplicates are ignored automatically).

## Sending newsletters later
This just *collects* emails. When you want to actually *send* a newsletter, export that
list and paste it into a free email tool (MailerLite, Mailchimp, Buttondown). Tell me when
you're there and I can wire the form straight into one of those instead, so collecting +
sending live in one place.
