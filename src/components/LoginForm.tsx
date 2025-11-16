"use client";
import { useState } from "react";

const theme = {
  primary: "#163E73",
  accent: "#217ABE",
  teal: "#3BBBCE",
};

export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [testing, setTesting] = useState(false);

  // optionaler Test-Login (schlägt fehl -> Fehler anzeigen)
  const testLogin = async () => {
    if (!username || !password) {
      alert("Bitte Benutzername und App-Passwort eingeben.");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login fehlgeschlagen");
      // success
      onLogin({ username, password, remember });
    } catch (err) {
      alert("Login fehlgeschlagen: " + (err.message || err));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow px-6 py-6">
        <h2 className="text-2xl font-semibold mb-2" style={{ color: theme.primary }}>Nextcloud Login</h2>
        <p className="text-sm text-gray-500 mb-4">Bitte Benutzername + Nextcloud App-Passwort eingeben.</p>

        <form onSubmit={(e) => { e.preventDefault(); testLogin(); }}>
          <label className="text-sm font-medium">Benutzername</label>
          <input
            className="w-full border rounded-md px-3 py-2 mt-1 mb-3 focus:outline-none focus:ring-2"
            style={{ borderColor: "#E6EEF8" }}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="z. B. ronja"
          />

          <label className="text-sm font-medium">App-Passwort</label>
          <input
            type="password"
            className="w-full border rounded-md px-3 py-2 mt-1 mb-2 focus:outline-none focus:ring-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="App-Passwort (Nextcloud → Einstellungen → Sicherheit)"
          />

          <label className="inline-flex items-center gap-2 text-sm my-2">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span>Merken (localStorage)</span>
          </label>

          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={testing} style={{ backgroundColor: theme.accent }} className="text-white px-4 py-2 rounded-md shadow">
              {testing ? "Prüfen..." : "Anmelden & Prüfen"}
            </button>

            <button type="button" onClick={() => onLogin({ username, password, remember })} className="border px-4 py-2 rounded-md">
              Direkt Anmelden
            </button>
          </div>
        </form>

        <div className="mt-4 text-xs text-gray-400">
          Hinweis: Nutze ein App-Passwort (Einstellungen → Sicherheit).
        </div>
      </div>
    </div>
  );
}
