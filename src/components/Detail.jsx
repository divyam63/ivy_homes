import { useEffect, useState } from "react";
import { api } from "../api.js";
import { title, prettyMoney } from "../utils/formatters.js";

export function Detail({ type, id, go }) {
  const [item, setItem] = useState();
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/v1/${type}/${encodeURIComponent(id)}`)
      .then(setItem)
      .catch((err) => setError(err.message));
  }, [type, id]);

  if (error)
    return (
      <main>
        <p className="error page-error">{error}</p>
      </main>
    );

  if (!item) return <main className="loading">Loading property…</main>;

  const entries = Object.entries(item).filter(
    ([, value]) => value !== null && value !== "" && !Array.isArray(value),
  );

  return (
    <main className="detail">
      <button
        className="back"
        onClick={() => go(type === "projects" ? "/projects" : `/${type}`)}
      >
        ← Back to results
      </button>
      <p className="eyebrow">{title(item.locality)} · MUMBAI</p>
      <h1>{item.apartment_name || item.title}</h1>
      <h2>
        {prettyMoney(item.price ?? item.price_min)}
        {item.price_max ? ` – ${prettyMoney(item.price_max)}` : ""}
      </h2>
      <p className="description">
        {item.description || "Property details supplied by Ivy Homes."}
      </p>
      <section className="details">
        {entries.map(([key, value]) => (
          <div key={key}>
            <span>{title(key.replaceAll("_", " "))}</span>
            <strong>
              {typeof value === "boolean"
                ? value
                  ? "Yes"
                  : "No"
                : String(value)}
            </strong>
          </div>
        ))}
      </section>
    </main>
  );
}
