import { title, prettyMoney, projectMoney } from "../utils/formatters.js";
import { listingId } from "../utils/helpers.js";

export function Card({ item, type, go, onSave, saved }) {
  const id = listingId(item);
  const isProject = type === "projects";
  const price = isProject
    ? `${projectMoney(item.price_min)} – ${projectMoney(item.price_max)}`
    : prettyMoney(item.price);
  const detailPath = isProject
    ? `/projects/${item.project_id}`
    : `/${type}/${id}`;

  return (
    <article className="card">
      <div className="card-top">
        <span className="tag">
          {isProject
            ? title(item.project_status)
            : `${item.bedroom || "—"} BHK`}
        </span>
        {!isProject && (
          <button
            className="save"
            aria-label="Save listing"
            onClick={() => onSave(item)}
          >
            {saved ? "♥" : "♡"}
          </button>
        )}
      </div>
      <button className="card-content" onClick={() => go(detailPath)}>
        <h3>{item.apartment_name || item.title || "Untitled property"}</h3>
        <p>{title(item.locality)}, Mumbai</p>
        <strong>{price}</strong>
        <div className="facts">
          {!isProject && <span>{item.carpet_area || "—"} sq ft</span>}
          <span>{title(item.furnishing || item.property_type)}</span>
          {isProject && <span>{item.total_units || "—"} homes</span>}
        </div>
      </button>
    </article>
  );
}
