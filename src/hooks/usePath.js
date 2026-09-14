import { useEffect, useState } from "react";

export function usePath() {
  const [path, setPath] = useState(location.pathname);
  useEffect(() => {
    const listener = () => setPath(location.pathname);
    addEventListener("popstate", listener);
    return () => removeEventListener("popstate", listener);
  }, []);
  const go = (to) => {
    history.pushState({}, "", to);
    setPath(to);
  };
  return [path, go];
}
