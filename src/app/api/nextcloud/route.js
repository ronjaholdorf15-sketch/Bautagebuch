import { parse } from "fast-xml-parser";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: { bodyParser: false },
};

async function propfind(url, username, password) {
  const res = await fetch(url, {
    method: "PROPFIND",
    headers: {
      Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
      Depth: "1",
    },
  });
  if (!res.ok) throw new Error(`Nextcloud PROPFIND failed ${res.status}`);
  const text = await res.text();
  return parse(text);
}

export default async function handler(req, res) {
  // POST JSON actions: folders or test
  if (req.method === "POST" && req.headers["content-type"] && req.headers["content-type"].includes("application/json")) {
    try {
      const body = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => (data += chunk));
        req.on("end", () => resolve(JSON.parse(data)));
        req.on("error", reject);
      });
      const { action, username, password } = body;
      if (!action || !username || !password) return res.status(400).json({ error: "Missing params" });

      // build user base url (your base server must be set in env NEXTCLOUD_URL)
      const NC_BASE = process.env.NEXTCLOUD_URL;
      if (!NC_BASE) return res.status(500).json({ error: "Server misconfigured: NEXTCLOUD_URL missing" });
      const userUrl = `${NC_BASE.replace(/\/$/, "")}/${encodeURIComponent(username)}/`;

      if (action === "test") {
        // depth 0 test
        const p = await fetch(userUrl, {
          method: "PROPFIND",
          headers: {
            Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
            Depth: "0",
          },
        });
        if (!p.ok) return res.status(401).json({ error: "Login fehlgeschlagen" });
        return res.status(200).json({ ok: true });
      }

      if (action === "folders") {
        const json = await propfind(userUrl, username, password);
        const responses = json["d:multistatus"] && json["d:multistatus"]["d:response"] ? json["d:multistatus"]["d:response"] : [];
        const folders = (Array.isArray(responses) ? responses : [responses])
          .map((item) => {
            if (!item) return null;
            const href = item["d:href"] || item["href"];
            if (!href) return null;
            const parts = href.split("/").filter(Boolean);
            return parts[parts.length - 1];
          })
          .filter(Boolean);
        return res.status(200).json({ folders });
      }

      return res.status(400).json({ error: "Unknown action" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message || "Server error" });
    }
  }

  // POST multipart/form-data => upload action
  if (req.method === "POST") {
    const form = formidable({ multiples: true, keepExtensions: true });
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        return res.status(500).send(err.message);
      }

      const action = fields.action;
      const username = fields.username;
      const password = fields.password;
      const folder = fields.folder;

      if (action !== "upload" || !username || !password || !folder) {
        return res.status(400).send("Missing upload parameters");
      }

      const NC_BASE = process.env.NEXTCLOUD_URL;
      if (!NC_BASE) return res.status(500).send("Server misconfigured: NEXTCLOUD_URL missing");
      const targetFolderBase = `${NC_BASE.replace(/\/$/, "")}/${encodeURIComponent(folder)}`;

      try {
        // upload text file (fields.textFile handled as file)
        if (files.textFile) {
          const tf = files.textFile;
          const content = fs.readFileSync(tf.filepath);
          const filename = tf.originalFilename || `bautagebuch_${Date.now()}.txt`;
          const putUrl = `${targetFolderBase}/${encodeURIComponent(filename)}`;
          const r = await fetch(putUrl, {
            method: "PUT",
            headers: { Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64") },
            body: content,
          });
          if (!r.ok) throw new Error(`Text upload failed ${r.status}`);
        }

        // images (may be single or array)
        const images = files.images ? (Array.isArray(files.images) ? files.images : [files.images]) : [];
        for (const img of images) {
          const content = fs.readFileSync(img.filepath);
          const filename = img.originalFilename || `image_${Date.now()}`;
          const putUrl = `${targetFolderBase}/${encodeURIComponent(filename)}`;
          const r = await fetch(putUrl, {
            method: "PUT",
            headers: { Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64") },
            body: content,
          });
          if (!r.ok) throw new Error(`Image upload failed ${r.status}`);
        }

        return res.status(200).send("Upload successful");
      } catch (uErr) {
        console.error("Upload error", uErr);
        return res.status(500).send(uErr.message || "Upload failed");
      }
    });
    return;
  }

  // otherwise
  res.status(405).json({ error: "Method not allowed" });
}
