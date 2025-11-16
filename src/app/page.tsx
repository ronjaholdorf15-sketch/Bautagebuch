"use client";

import { useState } from "react";
import LoginForm from "../components/LoginForm";
import BautagebuchApp from "../components/BautagebuchApp";

type LoginCredentials = {
  username: string;
  password: string;
};

export default function Page() {
  const [userData, setUserData] = useState<LoginCredentials | null>(null);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      {!userData ? (
        <LoginForm
          onLogin={(creds: LoginCredentials) => setUserData(creds)}
        />
      ) : (
        <BautagebuchApp
          username={userData.username}
          password={userData.password}
        />
      )}
    </main>
  );
}
