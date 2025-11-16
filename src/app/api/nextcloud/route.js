import { parse } from "fast-xml-parser";
import formidable from "formidable";
import fs from "fs";
import fetch from "node-fetch";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const NC_URL = process.env.NEXTCLOUD_URL;
  const NC_USER = process.env.NEXTCLOUD_USER;
  const NC_PASSWORD = process.env.NEXTCLOUD_PASSWORD;

  if (req.method === "GET") {
    const { user } = req.query;

    try {
      const response = await fetch(`${NC_URL}${encodeURIComponent(user)}/`, {
        method: "PROPFIND",
        headers: {
          Authorization: "Basic " + Buffer.from(`${NC_USER}:${NC_PASSWORD}`).toString("base64"),
          Depth: "1",
        },
      });

      if (!response.ok) throw new Error("Fehler beim Zugriff auf Nextcloud");

      const text = await response.text();
      const json = parse(text);
      const folders = (json["d:multistatus"]["d:response"] || []).map((item) => {
        const href = item["d:href"];
        if (!href) return null;
        const parts = href.split("/").filter(Boolean);
        return parts[parts.length - 1];
      }).filter(Boolean);

      res.status(200).json({ folders });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "POST") {
    const form = formidable({ multiples: true });
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).send(err.message);
      const folder = fields.folder;
      try {
        // Textdatei hochladen
        const textFile = files.textFile;
        if (textFile) {
          const content = fs.readFileSync(textFile.filepath);
          await fetch(`${NC_URL}${encodeURIComponent(folder)}/${textFile.originalFilename}`, {
            method: "PUT",
            headers: { Authorization: "Basic " + Buffer.from(`${NC_USER}:${NC_PASSWORD}`).toString("base64") },
            body: content,
          });
        }
        // Bilder hochladen
        const imgs = Array.isArray(files.images) ? files.images : [files.images];
        for (const img of imgs) {
          const content = fs.readFileSync(img.filepath);
          await fetch(`${NC_URL}${encodeURIComponent(folder)}/${img.originalFilename}`, {
            method: "PUT",
            headers: { Authorization: "Basic " + Buffer.from(`${NC_USER}:${NC_PASSWORD}`).toString("base64") },
            body: content,
          });
        }
        res.status(200).send("Upload erfolgreich!");
      } catch (err) {
        res.status(500).send(err.message);
      }
    });
  }
}
