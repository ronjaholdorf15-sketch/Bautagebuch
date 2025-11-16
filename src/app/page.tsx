"use client";

import { useState, useEffect } from "react";
import LoginForm from "../components/LoginForm";
import BautagebuchApp from "../components/BautagebuchApp";

export default function HomePage() {
  const [creds, setCreds] = useState(null);

  useEffect(() => {
    try {
      const s = sessionStorage.getItem("bautagebuch_creds");
      if (s) setCreds(JSON.parse(s));
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const handleLogin = (c) => {
    setCreds(c);
    try {
      if (c.remember) localStorage.setItem("bautagebuch_creds", JSON.stringify({ username: c.username, password: c.password }));
      else sessionStorage.setItem("bautagebuch_creds", JSON.stringify({ username: c.username, password: c.password }));
    } catch (e) {}
  };

  const handleLogout = () => {
    setCreds(null);
    try {
      sessionStorage.removeItem("bautagebuch_creds");
      localStorage.removeItem("bautagebuch_creds");
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="w-full bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <img src="/logo.jpg" alt="IT-KOM Logo" className="h-12 w-auto object-contain" />
          <div>
            <h1 style={{ color: "#163E73" }} className="text-2xl font-semibold">Bautagebuch</h1>
            <p className="text-sm text-gray-500">Digitales Bautagebuch — Uploads in Nextcloud</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {creds && (
              <button onClick={handleLogout} className="text-sm px-3 py-1 rounded border" >
                Abmelden
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!creds ? (
          <LoginForm onLogin={handleLogin} />
        ) : (
          <BautagebuchApp username={creds.username} storedCreds={creds} />
        )}
      </main>

      <footer className="mt-12 pb-8">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
          © {new Date().getFullYear()} IT-KOM — Bautagebuch
        </div>
      </footer>
    </div>
  );
}
