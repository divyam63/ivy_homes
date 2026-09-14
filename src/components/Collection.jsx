import { useEffect, useState } from "react";
import { api, getRecords } from "../api.js";
import { Filters } from "./Filters.jsx";
import { Card } from "./Card.jsx";
import { Pagination } from "./Pagination.jsx";
import { title } from "../utils/formatters.js";
import { listingId, assignedLocality } from "../utils/helpers.js";

export function Collection({ type, go }) {
  const [filters, setFilters] = useState(
    type === "rentals" ? { locality: assignedLocality } : {},
  );
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ results: [], total: 0, page_size: 20 });
  const [saved, setSaved] = useState(new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => setPage(1), [JSON.stringify(filters)]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      ...Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== ""),
      ),
      offset: (page - 1) * 20,
      limit: 20,
    });
    api(`/v1/${type}?${params}`)
      .then((result) => {
        // The API returns { results, offset, returned, has_more }
        const data = {
          results: getRecords(result),
          total: result.total || result.returned || 0,
          page_size: 20,
          has_more: result.has_more,
          offset: result.offset
        };
        !cancelled && setData(data);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [type, page, JSON.stringify(filters)]);

  useEffect(() => {
    if (type === "listings")
      api("/v1/saved")
        .then((r) => setSaved(new Set(getRecords(r).map(listingId))))
        .catch(() => {});
  }, [type]);

  async function toggleSave(item) {
    const id = listingId(item);
    try {
      if (saved.has(id)) {
        await api(`/v1/saved/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        setSaved((prev) => new Set([...prev].filter((x) => x !== id)));
      } else {
        await api("/v1/saved", { method: "POST", body: { listing_id: id } });
        setSaved((prev) => new Set(prev).add(id));
      }
    } catch (err) {
      setError(err.message);
    }
  }

  const heading =
    type === "listings"
      ? "Homes for sale"
      : type === "rentals"
        ? "Homes for rent"
        : "New projects";

  return (
    <main>
      <section className="hero">
        <p className="eyebrow">MUMBAI, INDIA</p>
        <h1>{heading}</h1>
        <p>
          Every filter is applied locally after retrieving the full collection,
          so results remain trustworthy even when a server-side filter is
          ignored.
        </p>
      </section>
      <Filters type={type} values={filters} onChange={setFilters} />
      {error && <p className="error page-error">{error}</p>}
      <p className="result-count">
        {loading
          ? "Loading homes…"
          : `${data.total} matching ${data.total === 1 ? "property" : "properties"}`}
      </p>
      <section className="grid">
        {data.results?.map((item) => (
          <Card
            item={item}
            type={type}
            go={go}
            onSave={toggleSave}
            saved={saved.has(listingId(item))}
            key={item.project_id || listingId(item)}
          />
        ))}
      </section>
      {!loading && !data.results?.length && (
        <div className="empty">No homes matched those filters.</div>
      )}
      <Pagination
        page={page}
        total={data.total}
        pageSize={data.page_size}
        onPage={setPage}
        hasMore={data.has_more}
      />
    </main>
  );
}
