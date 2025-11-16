"use client";
import { useState } from "react";

export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [testing, setTesting] = useState(false);

  // Optional: Test-Login (PROPFIND depth=0) to verify credentials before accepting
  const testLogin = async () => {
    if (!username || !password) {
      alert("Bitte Benutzername und App-Passwort eingeben.");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: JSON.stringify({ action: "test", username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login-Test fehlgeschlagen");
      alert("Login erfolgreich — du wirst eingeloggt.");
      onLogin({ username, password, remember });
    } catch (err) {
      alert("Login fehlgeschlagen: " + (err.message || err));
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // wir testen die Zugangsdaten vorab (kann übersprungen werden, aber empfohlen)
    testLogin();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white shadow rounded">
      <h2 className="text-xl font-semibold mb-4">Nextcloud Login (App-Passwort)</h2>

      <label className="block mb-2">Benutzername</label>
      <input
        className="w-full border p-2 mb-4"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="z. B. ronja"
      />

      <label className="block mb-2">App-Passwort</label>
      <input
        type="password"
        className="w-full border p-2 mb-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="App-Passwort aus Nextcloud (Einstellungen → Sicherheit)"
      />
      <label className="text-sm mb-3 inline-flex items-center gap-2">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        Merken (localStorage)
      </label>

      <div className="flex gap-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Anmelden & Testen
        </button>
        <button
          type="button"
          onClick={() => onLogin({ username, password, remember })}
          className="bg-gray-200 px-4 py-2 rounded"
        >
          Direkt Anmelden (ohne Test)
        </button>
      </div>

      {testing && <p className="text-sm mt-2">Login wird geprüft…</p>}
    </form>
  );
}
