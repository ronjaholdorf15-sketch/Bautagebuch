"use client";

import { useState } from "react";

export default function BautagebuchApp({ username, ncUrl, ncUser, ncPassword }) {
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
    if (!ncUrl || !ncUser || !ncPassword) {
      alert("Fehler: Nextcloud-Zugangsdaten fehlen");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/Route?url=${encodeURIComponent(ncUrl)}&username=${encodeURIComponent(
          ncUser
        )}&password=${encodeURIComponent(ncPassword)}`
      );
      const data = await res.json();
      if (res.ok) {
        setFolders(data.folders || []);
      } else {
        alert("Fehler: " + (data.error || "Unbekannter Fehler"));
      }
    } catch (err) {
      alert("Fehler beim Laden: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadToNextcloud = async (file) => {
    if (!ncFolder) {
      alert("Bitte zuerst einen Ordner auswählen!");
      return;
    }

    const filename = file.name || `bautagebuch_${Date.now()}.txt`;

    const res = await fetch(
      `/api/Route?url=${encodeURIComponent(ncUrl)}&username=${encodeURIComponent(
        ncUser
      )}&password=${encodeURIComponent(ncPassword)}&folder=${encodeURIComponent(
        ncFolder
      )}&filename=${encodeURIComponent(filename)}`,
      { method: "PUT", body: file }
    );

    if (!res.ok) {
      const msg = await res.text();
      throw new Error("Upload fehlgeschlagen: " + msg);
    }
  };

  const handleSave = async () => {
    if (!ncFolder) {
      alert("Bitte einen Ordner auswählen!");
      return;
    }

    setLoading(true);
    try {
      const textContent = `
Datum: ${date}
Adresse der Baustelle: ${address}

Was wurde erledigt:
${doneTasks}

Was fehlt noch:
${missingTasks}

Materialliste:
${materialList}
      `;
      const textFile = new Blob([textContent], { type: "text/plain" });
      await uploadToNextcloud(textFile);

      for (const img of images) {
        await uploadToNextcloud(img);
      }

      alert("✅ Alles erfolgreich in Nextcloud gespeichert!");

      setDate("");
      setDoneTasks("");
      setMissingTasks("");
      setAddress("");
      setMaterialList("");
      setImages([]);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg p-6 rounded-2xl mt-8">
      <h1 className="text-2xl font-bold mb-4 text-center">📘 Bautagebuch</h1>

      <div className="grid gap-3 mb-4">
        <input
          type="date"
          className="border rounded p-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          type="text"
          className="border rounded p-2"
          placeholder="Adresse der Baustelle"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <textarea
          className="border rounded p-2"
          rows={3}
          placeholder="Was wurde erledigt"
          value={doneTasks}
          onChange={(e) => setDoneTasks(e.target.value)}
        />
        <textarea
          className="border rounded p-2"
          rows={3}
          placeholder="Was fehlt noch"
          value={missingTasks}
          onChange={(e) => setMissingTasks(e.target.value)}
        />
        <textarea
          className="border rounded p-2"
          rows={3}
          placeholder="Materialliste"
          value={materialList}
          onChange={(e) => setMaterialList(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => document.getElementById("imageInput").click()}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            📷 Bilder auswählen
          </button>
          <input
            id="imageInput"
            type="file"
            multiple
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => setImages(Array.from(e.target.files))}
          />
          {images.length > 0 && <p className="text-sm">{images.length} Bild(er) ausgewählt</p>}
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h2 className="font-semibold mb-2">Nextcloud-Ordner</h2>
        <div className="flex gap-2 items-center mb-2">
          <button
            type="button"
            onClick={loadFolders}
            disabled={loading}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded"
          >
            📂 Ordner laden
          </button>

          {folders.length > 0 && (
            <select
              className="border rounded p-2"
              value={ncFolder}
              onChange={(e) => setNcFolder(e.target.value)}
            >
              <option value="">– Ordner wählen –</option>
              {folders.map((folder, idx) => (
                <option key={idx} value={folder}>
                  {folder}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded mt-4"
      >
        {loading ? "Speichern..." : "💾 Speichern & Hochladen"}
      </button>
    </div>
  );
}
