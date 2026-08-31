import { useState } from "react";
import { useLocation } from "react-router";
import { DjLoginForm } from "../components/dj/DjLoginForm";
import { DjPortal } from "../components/dj/DjPortal";
import { loadSession, logoutDj, type DjSession } from "../lib/dj-auth";

export function DjPage() {
  const location = useLocation();
  const [session, setSession] = useState<DjSession | null>(() => loadSession());

  if (session) {
    return (
      <DjPortal
        session={session}
        onLogout={() => {
          void logoutDj().then(() => setSession(null));
        }}
      />
    );
  }

  return <DjLoginForm key={location.key} onLoggedIn={setSession} />;
}
