# Deploying Whimsy Workshop to Netlify

This is a static site (no build step). Two ways to publish, then two dashboard toggles
to switch on the real admin login and automatic order capture.

## 1. Publish the site

**Easiest — drag & drop**
1. Go to https://app.netlify.com/drop
2. Drag the whole `whimsy-workshop` folder onto the page.
3. Done — you get a live URL like `https://your-name.netlify.app`.

**Or — connect a repo (auto-deploys on every change)**
1. Push this folder to a GitHub repo.
2. Netlify → "Add new site" → "Import from Git" → pick the repo.
3. Leave build command empty, publish directory `.` (already set in `netlify.toml`).

## 2. Turn on automatic order capture (Netlify Forms)

Already wired — the `orders` form is detected automatically at deploy.
- In the Netlify dashboard: **Forms** → you'll see submissions appear there after the
  first order (name, email, phone, address, items, total, notes).
- Optional: **Forms → Settings → Form notifications** → add an email so you get pinged
  at `samamerie0@gmail.com` on every new order.
- Locally (or opened as a file) orders fall back to opening a pre-filled email instead.

## 3. Turn on the real admin login (Netlify Identity)

1. Dashboard → **Identity** → **Enable Identity**.
2. **Identity → Registration** → set to **Invite only** (so only you can log in).
3. **Identity → Invite users** → invite `samamerie0@gmail.com`. Accept the email invite
   and set a password.
4. Visit `your-site.netlify.app/admin.html` → click **"Log in with Netlify"** → sign in.
   Only `samamerie0@gmail.com` is allowed in.

Until Identity is enabled, the admin still works with the local passcode
(email `samamerie0@gmail.com` + password `whimsy`, set in `admin.html`).

## Notes
- To make product edits permanent: in the admin, click **Download products.js** and
  replace the file, then re-deploy (or commit if using Git).
- Photos live in `/images` (already optimized to ~16 MB total).
- Custom domain: Netlify → Domain settings → add your domain.
