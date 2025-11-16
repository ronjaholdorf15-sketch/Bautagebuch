"use client";

import { useState, useEffect } from "react";
import LoginForm from "../components/LoginForm";
import BautagebuchApp from "../components/BautagebuchApp";

export default function HomePage() {
  const [creds, setCreds] = useState(null);

  // Wenn es gespeicherte Session-Creds gibt (sessionStorage), lade sie
  useEffect(() => {
    try {
      const s = sessionStorage.getItem("bautagebuch_creds");
      if (s) setCreds(JSON.parse(s));
    } catch (e) {
      console.warn("sessionStorage read failed", e);
    }
  }, []);

  const handleLogin = ({ username, password, remember }) => {
    const c = { username, password };
    setCreds(c);
    // nur sessionStorage standardmäßig — optional remember für localStorage
    try {
      if (remember) localStorage.setItem("bautagebuch_creds", JSON.stringify(c));
      else sessionStorage.setItem("bautagebuch_creds", JSON.stringify(c));
    } catch (e) {
      console.warn("storage failed", e);
    }
  };

  const handleLogout = () => {
    setCreds(null);
    try {
      sessionStorage.removeItem("bautagebuch_creds");
      localStorage.removeItem("bautagebuch_creds");
    } catch (e) {}
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      {!creds ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <>
          <div className="max-w-2xl mx-auto mb-4 flex justify-end gap-2">
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1 rounded border"
            >
              Abmelden
            </button>
          </div>
          <BautagebuchApp
            username={creds.username}
            // wir übergeben die creds in props, Komponente speichert nur in memory/session
            storedCreds={creds}
          />
        </>
      )}
    </main>
  );
}
