"use client";

import { useState } from "react";

export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({ username, password });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-4 bg-white shadow rounded"
    >
      <h2 className="text-xl font-semibold mb-4">Nextcloud Login</h2>
      <label className="block mb-2">Benutzername</label>
      <input
        className="w-full border p-2 mb-4"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <label className="block mb-2">Passwort</label>
      <input
        type="password"
        className="w-full border p-2 mb-4"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Login
      </button>
    </form>
  );
}
