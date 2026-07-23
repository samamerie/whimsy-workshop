/* Whimsy Workshop — publish function (Vercel).
   Commits the current data files from the admin to the GitHub repo, which makes
   Vercel rebuild the site (edits go live for everyone).
   Requires Vercel environment variables:
     PUBLISH_SECRET  — a password you choose (the admin asks for it)
     GITHUB_TOKEN    — a fine-grained GitHub token with "Contents: Read and write" on the repo
     GITHUB_REPO     — "owner/repo" (e.g. "samamerie/whimsy-workshop")
     GITHUB_BRANCH   — usually "main" (optional; defaults to main)
*/
export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).send("Method not allowed"); return; }

  let data = req.body;
  if (typeof data === "string") { try { data = JSON.parse(data); } catch { data = {}; } }
  data = data || {};

  const { secret, files } = data;
  if (!process.env.PUBLISH_SECRET || secret !== process.env.PUBLISH_SECRET) {
    res.status(401).send("Unauthorized"); return;
  }
  if (!files || typeof files !== "object") { res.status(400).send("No files"); return; }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!token || !repo) { res.status(500).send("Server not configured (missing GITHUB_TOKEN or GITHUB_REPO)"); return; }

  const headers = {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/vnd.github+json",
    "User-Agent": "whimsy-workshop-admin",
  };

  try {
    for (const [path, content] of Object.entries(files)) {
      const api = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path)}`;
      let sha;
      const get = await fetch(`${api}?ref=${branch}`, { headers });
      if (get.ok) { const j = await get.json(); sha = j.sha; }
      const body = {
        message: `Update ${path} from admin`,
        content: Buffer.from(String(content), "utf8").toString("base64"),
        branch,
      };
      if (sha) body.sha = sha;
      const put = await fetch(api, { method: "PUT", headers, body: JSON.stringify(body) });
      if (!put.ok) { res.status(502).send(`Failed on ${path}: ${put.status} ${await put.text()}`); return; }
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).send("Publish error: " + (e && e.message));
  }
}
