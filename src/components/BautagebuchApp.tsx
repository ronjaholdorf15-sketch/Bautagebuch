"use client";
import { useState } from "react";

const theme = {
  primary: "#163E73",
  accent: "#217ABE",
  teal: "#3BBBCE",
};

export default function BautagebuchApp({ username, storedCreds }) {
  const [date, setDate] = useState("");
  const [doneTasks, setDoneTasks] = useState("");
  const [missingTasks, setMissingTasks] = useState("");
  const [address, setAddress] = useState("");
  const [materialList, setMaterialList] = useState("");
  const [images, setImages] = useState([]);
  const [folders, setFolders] = useState([]);
  const [ncFolderHref, setNcFolderHref] = useState("");
  const [loading, setLoading] = useState(false);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "folders", username: storedCreds.username, password: storedCreds.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Laden fehlgeschlagen");
      setFolders(data.folders || []);
    } catch (err) {
      alert("Fehler beim Laden: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!ncFolderHref) {
      alert("Bitte Zielordner wählen.");
      return;
    }
    setLoading(true);
    try {
      const text = `
Datum: ${date || new Date().toISOString().slice(0,10)}
Adresse: ${address}

Was wurde erledigt:
${doneTasks}

Was fehlt noch:
${missingTasks}

Materialliste:
${materialList}
      `;

      const form = new FormData();
      form.append("action", "upload");
      form.append("username", storedCreds.username);
      form.append("password", storedCreds.password);
      form.append("folder", ncFolderHref);
      form.append("textFile", new Blob([text], { type: "text/plain" }), `bautagebuch_${Date.now()}.txt`);
      images.forEach((f) => form.append("images", f));

      const res = await fetch("/api/route", { method: "POST", body: form });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Upload fehlgeschlagen");
      }
      alert("Upload erfolgreich ✅");
      setDate(""); setAddress(""); setDoneTasks(""); setMissingTasks(""); setMaterialList(""); setImages([]);
    } catch (err) {
      alert("Upload-Fehler: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-start gap-6 mb-4">
          <div style={{ width: 72, height: 72, borderRadius: 12, background: theme.teal }} className="flex items-center justify-center">
            <span className="text-white font-bold">BT</span>
          </div>
          <div className="flex-1">
            <h2 style={{ color: theme.primary }} className="text-xl font-semibold">Bautagebuch</h2>
            <p className="text-sm text-gray-500">Eingeloggt als <strong>{username}</strong></p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button onClick={loadFolders} style={{ borderColor: theme.primary }} className="px-3 py-2 rounded border text-sm">📂 Ordner laden</button>
            <div className="text-xs text-gray-400">Lade persönliche + Gruppenordner</div>
          </div>
        </div>

        <div className="grid gap-3">
          <input type="date" className="border rounded-md p-2" value={date} onChange={(e)=>setDate(e.target.value)} />

          <input type="text" placeholder="Adresse der Baustelle" className="border rounded-md p-2" value={address} onChange={(e)=>setAddress(e.target.value)} />

          <textarea rows={3} placeholder="Was wurde erledigt" className="border rounded-md p-2" value={doneTasks} onChange={(e)=>setDoneTasks(e.target.value)} />
          <textarea rows={3} placeholder="Was fehlt noch" className="border rounded-md p-2" value={missingTasks} onChange={(e)=>setMissingTasks(e.target.value)} />
          <textarea rows={3} placeholder="Materialliste" className="border rounded-md p-2" value={materialList} onChange={(e)=>setMaterialList(e.target.value)} />

          <div className="flex items-center gap-3">
            <button type="button" onClick={()=>document.getElementById("imageInput").click()} style={{ background: theme.accent }} className="text-white px-4 py-2 rounded-md">📷 Bilder auswählen</button>
            <input id="imageInput" type="file" multiple accept="image/*" style={{ display: "none" }} onChange={(e)=>setImages(Array.from(e.target.files||[]))} />
            <div className="text-sm text-gray-600">{images.length} Bild(er) ausgewählt</div>
          </div>
        </div>

        <div className="mt-5 border-t pt-4">
          <label className="block text-sm mb-2 font-medium">Zielordner</label>
          <div className="flex gap-3 items-center">
            <select className="flex-1 border rounded-md p-2" value={ncFolderHref} onChange={(e)=>setNcFolderHref(e.target.value)}>
              <option value="">– Ordner wählen –</option>
              {folders.map((f,i)=>(
                <option key={i} value={f.href}>{f.name}</option>
              ))}
            </select>
            <button onClick={handleSave} style={{ background: theme.primary }} className="text-white px-4 py-2 rounded-md">
              {loading ? "Speichern..." : "💾 Speichern & Hochladen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
