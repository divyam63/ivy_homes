import { useEffect, useState } from "react";
import { api, getRecords } from "../api.js";
import { Card } from "./Card.jsx";
import { listingId } from "../utils/helpers.js";

export function Saved({ go }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/v1/saved")
      .then((r) => setItems(getRecords(r)))
      .catch((err) => setError(err.message));
  }, []);

  const reload = () => {
    api("/v1/saved")
      .then((r) => setItems(getRecords(r)))
      .catch((err) => setError(err.message));
  };

  async function remove(item) {
    try {
      await api(`/v1/saved/${encodeURIComponent(listingId(item))}`, {
        method: "DELETE",
      });
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main>
      <section className="hero compact">
        <p className="eyebrow">YOUR SHORTLIST</p>
        <h1>Saved homes</h1>
      </section>
      {error && <p className="error page-error">{error}</p>}
      <section className="grid">
        {items.map((item) => (
          <Card
            key={listingId(item)}
            item={item}
            type="listings"
            go={go}
            saved
            onSave={remove}
          />
        ))}
      </section>
      {!error && !items.length && (
        <div className="empty">Save a listing to find it here later.</div>
      )}
    </main>
  );
}
