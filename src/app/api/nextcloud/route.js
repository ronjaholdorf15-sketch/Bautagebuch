// src/pages/api/route.js
import { parse } from "fast-xml-parser";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: { bodyParser: false },
};

const NC_BASE = process.env.NEXTCLOUD_URL || ""; // e.g. https://nc-.../remote.php/dav/files
const NC_ORIGIN = process.env.NEXTCLOUD_ORIGIN || ""; // e.g. https://nc-...

if (!NC_BASE || !NC_ORIGIN) {
  console.warn("NEXTCLOUD_URL or NEXTCLOUD_ORIGIN not set");
}

async function doPropfind(url, username, password, depth = "1") {
  const res = await fetch(url, {
    method: "PROPFIND",
    headers: {
      Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
      Depth: depth,
      Accept: "*/*",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`PROPFIND failed ${res.status} ${text}`);
    err.status = res.status;
    throw err;
  }
  const text = await res.text();
  return parse(text);
}

export default async function handler(req, res) {
  try {
    // JSON POST for actions (folders/test)
    if (req.method === "POST" && req.headers["content-type"] && req.headers["content-type"].includes("application/json")) {
      // read json
      const body = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (c) => (data += c));
        req.on("end", () => {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        });
        req.on("error", reject);
      });

      const { action, username, password } = body;
      if (!action || !username || !password) return res.status(400).json({ error: "Missing params" });

      // construct user files URL (we expect NEXTCLOUD_URL to be e.g. https://nc.../remote.php/dav/files)
      // userUrl should be e.g. https://.../remote.php/dav/files/<username>/
      const base = NC_BASE.replace(/\/$/, ""); // remove trailing slash
      const userUrl = `${base}/${encodeURIComponent(username)}/`;

      if (action === "test") {
        // PROPFIND depth 0 to verify credentials
        try {
          await doPropfind(userUrl, username, password, "0");
          return res.status(200).json({ ok: true });
        } catch (err) {
          return res.status(err.status || 401).json({ error: "Login failed" });
        }
      }

      if (action === "folders") {
        try {
          const json = await doPropfind(userUrl, username, password, "1");
          // handle case when single response or array
          const responses = (json["d:multistatus"] && json["d:multistatus"]["d:response"]) || [];
          const arr = Array.isArray(responses) ? responses : [responses];

          // map to { name, href } where href is the full webdav path returned by Nextcloud (usually starts with /remote.php/...)
          const folders = arr
            .map((item) => {
              if (!item) return null;
              const href = item["d:href"] || item["href"];
              if (!href) return null;
              // decode and compute display name
              const decoded = decodeURIComponent(href);
              const parts = decoded.split("/").filter(Boolean);
              const name = parts[parts.length - 1] || "";
              // keep the href as-is (may be absolute or root-based)
              return { name, href: href };
            })
            .filter(Boolean);
          return res.status(200).json({ folders });
        } catch (err) {
          console.error("folders error", err);
          return res.status(err.status || 500).json({ error: err.message || "Failed to fetch folders" });
        }
      }

      return res.status(400).json({ error: "Unknown action" });
    }

    // multipart upload - handle text + images
    if (req.method === "POST") {
      // parse form
      const form = formidable({ multiples: true, keepExtensions: true });
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error("form parse err", err);
          return res.status(500).send(err.message);
        }

        const action = fields.action;
        if (action !== "upload") return res.status(400).send("Invalid action");
        const username = fields.username;
        const password = fields.password;
        const folderHref = fields.folder; // must be the href returned by folders API (e.g. /remote.php/dav/files/username/GroupFolder/)
        if (!username || !password || !folderHref) return res.status(400).send("Missing params");

        try {
          // compute upload base URL:
          // if folderHref is absolute path (starting with /), we want NC_ORIGIN + folderHref (no duplicate)
          // else if folderHref is full URL starting with http(s), use it as base
          let folderBase = folderHref;
          if (folderHref.startsWith("/")) {
            // NC_ORIGIN must be like https://nc-...
            if (!NC_ORIGIN) return res.status(500).send("Server misconfigured: NEXTCLOUD_ORIGIN missing");
            folderBase = `${NC_ORIGIN.replace(/\/$/, "")}${folderHref.replace(/\/$/, "")}`;
          } else if (/^https?:\/\//.test(folderHref)) {
            folderBase = folderHref.replace(/\/$/, "");
          } else {
            // relative, fallback to NC_BASE + /<folderHref>
            const base = NC_BASE.replace(/\/$/, "");
            folderBase = `${base}/${folderHref.replace(/^\//, "").replace(/\/$/, "")}`;
          }

          // upload textFile if present
          if (files.textFile) {
            const tf = files.textFile;
            const content = fs.readFileSync(tf.filepath);
            const filename = tf.originalFilename || `bautagebuch_${Date.now()}.txt`;
            const putUrl = `${folderBase}/${encodeURIComponent(filename)}`;
            const r = await fetch(putUrl, {
              method: "PUT",
              headers: { Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64") },
              body: content,
            });
            if (!r.ok) {
              const t = await r.text().catch(() => "");
              throw new Error(`Text upload failed ${r.status} ${t}`);
            }
          }

          // images
          const imgField = files.images;
          const imgArr = imgField ? (Array.isArray(imgField) ? imgField : [imgField]) : [];
          for (const img of imgArr) {
            const content = fs.readFileSync(img.filepath);
            const filename = img.originalFilename || `image_${Date.now()}`;
            const putUrl = `${folderBase}/${encodeURIComponent(filename)}`;
            const r = await fetch(putUrl, {
              method: "PUT",
              headers: { Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64") },
              body: content,
            });
            if (!r.ok) {
              const t = await r.text().catch(() => "");
              throw new Error(`Image upload failed ${r.status} ${t}`);
            }
          }

          return res.status(200).send("ok");
        } catch (uErr) {
          console.error("upload error", uErr);
          return res.status(500).send(uErr.message || "Upload failed");
        }
      });
      return;
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (finalErr) {
    console.error("route final err", finalErr);
    return res.status(500).json({ error: finalErr.message || "Server error" });
  }
}
