"use client";
import { useState } from "react";

export default function LoginForm({ onLogin }) {
  // Fester Nextcloud-Server-Link
  const FIXED_URL = "https://nc-1378779500208301258.nextcloud-ionos.com/remote.php/dav/files/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const userUrl = `${FIXED_URL}${username}/`;

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: userUrl, username, password }),
    });

    const data = await res.json();

    if (data.success) {
      onLogin({ url: userUrl, username, password });
    } else {
      setError(data.error || "Login fehlgeschlagen");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10 p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4 text-center">🔐 Nextcloud Login</h2>
      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <input
          className="border rounded p-2"
          type="text"
          placeholder="Benutzername"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="border rounded p-2"
          type="password"
          placeholder="App-Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="bg-blue-600 text-white rounded p-2 hover:bg-blue-700"
        >
          Anmelden
        </button>
      </form>
    </div>
  );
}
