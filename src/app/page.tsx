"use client";

import { useState } from "react";
import LoginForm from "../components/LoginForm";
import BautagebuchApp from "../components/BautagebuchApp";

export default function Home() {
  const [userData, setUserData] = useState<null | {
    url: string;
    username: string;
    password: string;
  }>(null);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      {!userData ? (
        <LoginForm onLogin={(creds) => setUserData(creds)} />
      ) : (
        <BautagebuchApp
          username={userData.username}
          ncUrl={userData.url}
          ncUser={userData.username}
          ncPassword={userData.password}
        />
      )}
    </main>
  );
}
