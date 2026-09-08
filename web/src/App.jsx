import { useEffect, useState } from "react";
import Desk from "./Desk";
import Gate from "./courthouse/Gate";
import Hall from "./courthouse/Hall";
import { loadSession } from "./courthouse/session";
import "./courthouse/courthouse.css";

function routeFromHash() {
  const hash = window.location.hash.replace("#", "");
  return hash === "desk" ? "desk" : "courthouse";
}

export default function App() {
  const [route, setRoute] = useState(routeFromHash);
  const [session, setSession] = useState(() => loadSession());

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (route === "desk") {
    return <Desk />;
  }

  if (!session) {
    return <Gate onEnter={setSession} />;
  }

  return <Hall session={session} onSession={setSession} onSignOut={() => setSession(null)} />;
}
