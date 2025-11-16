"use client";

import { useState } from "react";

export default function BautagebuchApp({ username, storedCreds }) {
  const [date, setDate] = useState("");
  const [doneTasks, setDoneTasks] = useState("");
  const [missingTasks, setMissingTasks] = useState("");
  const [address, setAddress] = useState("");
  const [materialList, setMaterialList] = useState("");
  const [images, setImages] = useState([]);
  const [folders, setFolders] = useState([]);
  const [ncFolder, setNcFolder] = useState("");
  const [loading, setLoading] = useState(false);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "folders",
          username: storedCreds.username,
          password: storedCreds.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ordner laden fehlgeschlagen");
      setFolders(data.folders || []);
    } catch (err) {
      alert("Fehler beim Laden: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!ncFolder) {
      alert("Bitte Zielordner wählen.");
      return;
    }
    setLoading(true);
    try {
      const textContent = `
Datum: ${date || new Date().toISOString().slice(0, 10)}
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
      form.append("folder", ncFolder);
      form.append("textFile", new Blob([textContent], { type: "text/plain" }), `bautagebuch_${Date.now()}.txt`);

      images.forEach((f) => form.append("images", f));

      const res = await fetch("/api/route", { method: "POST", body: form });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Upload fehlgeschlagen");
      }

      alert("Erfolgreich hochgeladen!");
      // reset
      setDate("");
      setAddress("");
      setDoneTasks("");
      setMissingTasks("");
      setMaterialList("");
      setImages([]);
    } catch (err) {
      alert("Upload Fehler: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg p-6 rounded-2xl mt-8">
      <h1 className="text-2xl font-bold mb-4 text-center">📘 Bautagebuch — {username}</h1>

      <div className="grid gap-3 mb-4">
        <input type="date" className="border rounded p-2" value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="text" className="border rounded p-2" placeholder="Adresse der Baustelle" value={address} onChange={(e) => setAddress(e.target.value)} />
        <textarea className="border rounded p-2" rows={3} placeholder="Was wurde erledigt" value={doneTasks} onChange={(e) => setDoneTasks(e.target.value)} />
        <textarea className="border rounded p-2" rows={3} placeholder="Was fehlt noch" value={missingTasks} onChange={(e) => setMissingTasks(e.target.value)} />
        <textarea className="border rounded p-2" rows={3} placeholder="Materialliste" value={materialList} onChange={(e) => setMaterialList(e.target.value)} />

        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => document.getElementById("imageInput").click()} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">📷 Bilder auswählen</button>
          <input id="imageInput" type="file" multiple accept="image/*" style={{ display: "none" }} onChange={(e) => setImages(Array.from(e.target.files || []))} />
          {images.length > 0 && <p className="text-sm">{images.length} Bild(er) ausgewählt</p>}
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h2 className="font-semibold mb-2">Nextcloud-Ordner</h2>
        <div className="flex gap-2 items-center mb-2">
          <button onClick={loadFolders} disabled={loading} className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded">📂 Ordner laden</button>

          {folders.length > 0 && (
            <select className="border rounded p-2" value={ncFolder} onChange={(e) => setNcFolder(e.target.value)}>
              <option value="">– Ordner wählen –</option>
              {folders.map((f, i) => (<option key={i} value={f}>{f}</option>))}
            </select>
          )}
        </div>
      </div>

      <button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded mt-4">{loading ? "Arbeite..." : "💾 Speichern & Hochladen"}</button>
    </div>
  );
}
