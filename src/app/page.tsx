"use client";

import { useState } from "react";
import LoginForm from "../components/LoginForm";
import BautagebuchApp from "../components/BautagebuchApp";

export default function HomePage() {
  const [userData, setUserData] = useState<{ username: string; password: string } | null>(null);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      {!userData ? (
        <LoginForm
          onLogin={(creds: { username: string; password: string }) =>
            setUserData(creds)
          }
        />
      ) : (
        <BautagebuchApp
          username={userData.username}
          ncUser={userData.username}
          ncPassword={userData.password}
          ncUrl="https://nc-1378779500208301258.nextcloud-ionos.com/remote.php/dav/files/deinBenutzername/"
        />
      )}
    </main>
  );
}
