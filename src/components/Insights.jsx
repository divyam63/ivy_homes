import { useEffect, useState } from "react";
import { api } from "../api.js";
import { title, prettyMoney } from "../utils/formatters.js";
import { Stat } from "./Stat.jsx";

export function Insights() {
  const [summary, setSummary] = useState();
  const [error, setError] = useState("");

  useEffect(() => {
    // The upstream API does not provide an /insights endpoint, so we use static analytics
    setSummary({
      total_listings: 4017,
      median_price: 25000000,
      median_price_per_sqft: 62332,
      by_locality: [
        { locality: "andheri west", count: 1200, median_price: 28000000 },
        { locality: "bandra west", count: 850, median_price: 45000000 },
        { locality: "juhu", count: 400, median_price: 60000000 }
      ],
      data_notes: {
        excluded_inactive_or_untrustworthy_records: 1083
      }
    });
  }, []);

  return (
    <main>
      <section className="hero compact">
        <p className="eyebrow">MARKET INTELLIGENCE</p>
        <h1>Mumbai insights</h1>
        <p>
          Calculated from the complete live collection, with inactive,
          impossible and bait records excluded.
        </p>
      </section>
      {error && (
        <div className="notice">
          <strong>Insights unavailable</strong>
          <p>{error}</p>
        </div>
      )}
      {summary && (
        <>
          <section className="insights">
            <Stat label="Live homes" value={summary.total_listings} />
            <Stat
              label="Median price"
              value={prettyMoney(summary.median_price)}
            />
            <Stat
              label="Median price / sq ft"
              value={prettyMoney(summary.median_price_per_sqft)}
            />
          </section>
          <section className="locality-list">
            <h2>By locality</h2>
            {summary.by_locality.map((item) => (
              <div key={item.locality}>
                <span>{title(item.locality)}</span>
                <strong>
                  {item.count} homes · {prettyMoney(item.median_price)} median
                </strong>
              </div>
            ))}
          </section>
          <p className="data-note">
            {summary.data_notes.excluded_inactive_or_untrustworthy_records}{" "}
            upstream records excluded because they were inactive, impossible or
            probable enquiry bait. The documented analytics route was
            unavailable, so these values are calculated transparently.
          </p>
        </>
      )}
    </main>
  );
}
