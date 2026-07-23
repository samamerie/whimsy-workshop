# Direct "Publish to website" — one-time setup

This makes the admin's **"✦ Publish to website"** button push your edits (products,
markets, About photo) straight to the live site — no download-and-replace. It works by
committing your data files to your GitHub repo, which makes Netlify rebuild the site.

You only do this setup once. After that, editing is: **Save → Publish → done.**

## What you need
- Your site in a **GitHub repo**, deployed on **Netlify from that repo** (the connected-repo
  option, not drag-and-drop). See DEPLOY.md.

## Steps

### 1. Make a GitHub token
1. GitHub → your avatar → **Settings** → **Developer settings** → **Personal access tokens**
   → **Fine-grained tokens** → **Generate new token**.
2. **Repository access** → *Only select repositories* → pick your whimsy-workshop repo.
3. **Permissions** → **Repository permissions** → **Contents** → **Read and write**.
4. Generate, and copy the token (starts with `github_pat_…`). You won't see it again.

### 2. Add 4 settings in Netlify
Netlify dashboard → your site → **Site configuration** → **Environment variables** → add:

| Key | Value |
| --- | --- |
| `GITHUB_TOKEN` | the token you just copied |
| `GITHUB_REPO` | `your-username/your-repo` (e.g. `samamerie/whimsy-workshop`) |
| `GITHUB_BRANCH` | `main` (or `master` if that's your default branch) |
| `PUBLISH_SECRET` | any password you choose — you'll type it in the admin |

Then **redeploy** the site once (Deploys → Trigger deploy) so the function picks up the settings.

### 3. Use it
1. Go to `your-site.netlify.app/admin.html`, log in.
2. Make your edits, click **Save** where relevant.
3. Click **✦ Publish to website** → enter your `PUBLISH_SECRET` the first time.
4. Wait ~1 minute — Netlify rebuilds and your changes are live for everyone.

## Notes
- The publish button does nothing useful when you open the files locally (there's no server) —
  locally, keep using **Download**. It only publishes on the deployed Netlify site.
- If you ever change the `PUBLISH_SECRET`, you'll be asked for the new one next time.
- Security: the `PUBLISH_SECRET` gates the function, and the token can only touch this one repo.
  It's light protection suited to a small shop — fine for this use.
