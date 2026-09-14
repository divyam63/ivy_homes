export function Filters({ type, values, onChange }) {
  const update = (key, value) => onChange({ ...values, [key]: value });

  return (
    <div className="filters">
      <label>
        Locality
        <input
          placeholder="e.g. Andheri West"
          value={values.locality || ""}
          onChange={(e) => update("locality", e.target.value)}
        />
      </label>
      {type !== "projects" && (
        <label>
          BHK
          <select
            value={values.bedroom || ""}
            onChange={(e) => update("bedroom", e.target.value)}
          >
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option value={n} key={n}>
                {n} BHK
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Min price
        <input
          type="number"
          min="0"
          value={values.min_price || ""}
          onChange={(e) => update("min_price", e.target.value)}
        />
      </label>
      <label>
        Max price
        <input
          type="number"
          min="0"
          value={values.max_price || ""}
          onChange={(e) => update("max_price", e.target.value)}
        />
      </label>
      {type !== "projects" ? (
        <label>
          Furnishing
          <select
            value={values.furnishing || ""}
            onChange={(e) => update("furnishing", e.target.value)}
          >
            <option value="">Any</option>
            <option value="unfurnished">Unfurnished</option>
            <option value="semi-furnished">Semi-furnished</option>
            <option value="fully-furnished">Fully furnished</option>
          </select>
        </label>
      ) : (
        <label>
          Status
          <input
            placeholder="e.g. ready to move"
            value={values.status || ""}
            onChange={(e) => update("status", e.target.value)}
          />
        </label>
      )}
      <button className="clear" onClick={() => onChange({})}>
        Reset
      </button>
    </div>
  );
}
