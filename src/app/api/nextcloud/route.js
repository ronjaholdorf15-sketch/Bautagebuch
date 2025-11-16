import { parse } from "fast-xml-parser";

export default async function handler(req, res) {
  const { url, username, password } = req.query;

  if (!url || !username || !password) {
    res.status(400).json({ error: "Zugangsdaten fehlen" });
    return;
  }

  try {
    const response = await fetch(url, {
      method: "PROPFIND",
      headers: {
        Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
        Depth: "1",
      },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: "Fehler beim Zugriff auf Nextcloud" });
      return;
    }

    const text = await response.text();
    const json = parse(text);

    const folders = (json["d:multistatus"]["d:response"] || [])
      .map((item) => {
        const href = item["d:href"];
        if (!href) return null;
        const parts = href.split("/").filter(Boolean);
        return parts[parts.length - 1];
      })
      .filter(Boolean);

    res.status(200).json({ folders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
