import { routes } from "../utils/helpers.js";

export function Header({ path, go, session, onLogout }) {
  return (
    <header>
      <button className="brand" onClick={() => go("/")}>
        ivy<span>.</span>homes
      </button>
      <nav>
        {Object.entries(routes).map(([name, route]) => (
          <button
            className={path === route ? "active" : ""}
            onClick={() => go(route)}
            key={route}
          >
            {name}
          </button>
        ))}
      </nav>
      <div className="account">
        <span>{session?.user?.name || session?.user?.email}</span>
        <button onClick={onLogout}>Log out</button>
      </div>
    </header>
  );
}
