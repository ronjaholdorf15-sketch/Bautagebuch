"use client";

import { useState } from "react";
import LoginForm from "../components/LoginForm";
import BautagebuchApp from "../components/BautagebuchApp";

export default function HomePage() {
  const [userData, setUserData] = useState(null);

  const handleLogin = (creds) => {
    setUserData(creds);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      {!userData ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <BautagebuchApp
          username={userData.username}
          ncUser={userData.username}
          ncPassword={userData.password}
          ncUrl={`https://nc-1378779500208301258.nextcloud-ionos.com/remote.php/dav/files/${encodeURIComponent(
            userData.username
          )}/`}
        />
      )}
    </main>
  );
}
