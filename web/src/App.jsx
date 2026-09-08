import { useEffect, useState } from "react";
import Desk from "./Desk";
import Binder from "./courthouse/Binder";
import { loadSession, seedDemoSession } from "./courthouse/session";
import "./courthouse/courthouse.css";

function routeFromHash() {
  const hash = window.location.hash.replace("#", "");
  return hash === "desk" ? "desk" : "binder";
}

export default function App() {
  const [route, setRoute] = useState(routeFromHash);
  const [session, setSession] = useState(() => loadSession() || seedDemoSession());

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (route === "desk") {
    return <Desk />;
  }

  return (
    <Binder
      session={session}
      onSession={setSession}
      onSignOut={() => setSession(seedDemoSession())}
    />
  );
}
