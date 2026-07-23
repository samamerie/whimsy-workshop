/* Whimsy Workshop — publish function.
   Receives the current data files from the admin and commits them to the site's
   GitHub repo, which triggers a Netlify redeploy (making edits live for everyone).
   Requires these Netlify environment variables:
     PUBLISH_SECRET  — a password you choose (the admin asks for it)
     GITHUB_TOKEN    — a fine-grained GitHub token with "Contents: Read and write" on the repo
     GITHUB_REPO     — "owner/repo" (e.g. "samamerie/whimsy-workshop")
     GITHUB_BRANCH   — usually "main" (optional; defaults to main)
*/
export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  let payload;
  try { payload = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, body: "Bad request" }; }

  const { secret, files } = payload;
  if (!process.env.PUBLISH_SECRET || secret !== process.env.PUBLISH_SECRET) {
    return { statusCode: 401, body: "Unauthorized" };
  }
  if (!files || typeof files !== "object") {
    return { statusCode: 400, body: "No files" };
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!token || !repo) {
    return { statusCode: 500, body: "Server not configured (missing GITHUB_TOKEN or GITHUB_REPO)" };
  }

  const headers = {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/vnd.github+json",
    "User-Agent": "whimsy-workshop-admin",
  };

  try {
    for (const [path, content] of Object.entries(files)) {
      const api = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path)}`;
      // current sha (if the file already exists)
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
      if (!put.ok) {
        const t = await put.text();
        return { statusCode: 502, body: `Failed on ${path}: ${put.status} ${t}` };
      }
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: "Publish error: " + (e && e.message) };
  }
};
