export function Pagination({ page, total, pageSize, onPage, hasMore }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  
  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span>
        Page {page} of {pages || "..."}
      </span>
      <button disabled={!hasMore && page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </div>
  );
}
