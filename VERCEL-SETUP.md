# Deploying Whimsy Workshop (GitHub + Vercel + Stripe)

Same stack as your education site. Static pages + serverless functions in `/api`.

## 1. Put the code on GitHub
- Create a new repo (e.g. `whimsy-workshop`) and push this folder to it
  (GitHub Desktop → Add existing repo → Publish, or `git remote add` + `git push`).

## 2. Import to Vercel
- Vercel → **Add New… → Project** → import the repo.
- Framework preset: **Other** (it's a static site). No build command, output = root.
- Deploy → you get a live URL like `whimsy-workshop.vercel.app`.

## 3. Environment variables (Vercel → Project → Settings → Environment Variables)

**For card payments (required):**
| Key | Value |
| --- | --- |
| `STRIPE_SECRET_KEY` | your Stripe secret key — `sk_test_…` while testing, `sk_live_…` when live |

**For the one-click "Publish to website" button (optional):**
| Key | Value |
| --- | --- |
| `PUBLISH_SECRET` | a password you choose (the admin asks for it) |
| `GITHUB_TOKEN` | fine-grained GitHub token, "Contents: Read and write" on this repo |
| `GITHUB_REPO` | `your-username/whimsy-workshop` |
| `GITHUB_BRANCH` | `main` |

After adding variables, **redeploy** (Deployments → ⋯ → Redeploy) so the functions pick them up.

## 4. Test a payment (Stripe TEST mode)
1. In Stripe, keep the **Test mode** toggle ON. Copy the **test** secret key (`sk_test_…`)
   into `STRIPE_SECRET_KEY`, redeploy.
2. On your live site, add something to the cart → **Checkout** → you'll land on Stripe.
3. Pay with the test card **4242 4242 4242 4242**, any future date, any CVC/postal.
4. You should return to the **thank-you** page, and see the payment in your Stripe test dashboard.

## 5. Go live for real money
1. Finish Stripe's business + bank verification (Stripe dashboard → Activate).
2. Switch Stripe to **Live mode**, copy the **live** secret key (`sk_live_…`) into
   `STRIPE_SECRET_KEY` on Vercel, redeploy. Done — real card payments.

## Notes
- **Admin login** is the passcode gate (email `samamerie0@gmail.com` + password in `admin.html`).
  It's light protection; fine for a small shop. Change the password in `admin.html`.
- Orders + payments live in your **Stripe dashboard** (customer email, shipping address, phone
  are collected by Stripe at checkout).
- Editing: Admin → Save → **✦ Publish to website** (once the GitHub vars above are set), or
  **Download** the files and commit them yourself.
