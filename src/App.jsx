import { useState } from "react";
import { api, clearSession, getSession } from "./api.js";
import { usePath } from "./hooks/usePath.js";
import { Login } from "./components/Login.jsx";
import { Header } from "./components/Header.jsx";
import { Collection } from "./components/Collection.jsx";
import { Detail } from "./components/Detail.jsx";
import { Insights } from "./components/Insights.jsx";
import { Saved } from "./components/Saved.jsx";

export function App() {
  const [session, setCurrentSession] = useState(getSession());
  const [path, go] = usePath();

  if (!session) return <Login onLogin={setCurrentSession} />;

  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      /* local logout remains safe */
    }
    clearSession();
    setCurrentSession(null);
  };

  const detail = path.match(/^\/(listings|rentals|projects)\/(.+)$/);
  let content = detail ? (
    <Detail type={detail[1]} id={decodeURIComponent(detail[2])} go={go} />
  ) : path === "/rentals" ? (
    <Collection type="rentals" go={go} />
  ) : path === "/projects" ? (
    <Collection type="projects" go={go} />
  ) : path === "/insights" ? (
    <Insights />
  ) : path === "/saved" ? (
    <Saved go={go} />
  ) : (
    <Collection type="listings" go={go} />
  );

  return (
    <>
      <Header path={path} go={go} session={session} onLogout={logout} />
      {content}
    </>
  );
}
