'use client';

import { useMemo, useState } from 'react';
import Pagination from 'pagination-dropdown-select';

const records = Array.from({ length: 87 }, (_, index) => ({
  id: index + 1,
  name: `Sample record ${String(index + 1).padStart(3, '0')}`,
  category: ['Documents', 'Orders', 'Customers'][index % 3],
  status: index % 4 === 0 ? 'Pending' : 'Active',
}));

export default function PaginationDemo() {
  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term
      ? records.filter((record) =>
          `${record.id} ${record.name} ${record.category} ${record.status}`.toLowerCase().includes(term),
        )
      : records;
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);
  const from = filtered.length ? start + 1 : 0;
  const to = Math.min(start + pageSize, filtered.length);

  return (
    <section className="paginationDemo" aria-label="Pagination example records">
      <div className="row">
        <label className="grow">
          Search sample records
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Try: orders, pending, record 025"
          />
        </label>
        <button type="button" className="subtle" onClick={() => {
          setQuery('');
          setCurrentPage(1);
          setPageSize(10);
        }}>
          Reset example
        </button>
      </div>

      <p className="hint" role="status" aria-live="polite">
        Showing {from}–{to} of {filtered.length} matching records
      </p>
      <div className="tableScroll" role="region" aria-label="Sample records table" tabIndex={0}>
        <table className="recordsTable">
          <thead><tr><th scope="col">ID</th><th scope="col">Record</th><th scope="col">Category</th><th scope="col">Status</th></tr></thead>
          <tbody>
            {visible.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td><td>{record.name}</td><td>{record.category}</td><td>{record.status}</td>
              </tr>
            ))}
            {visible.length === 0 && <tr><td colSpan={4}>No matching records. Try a different search.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="paginationControls">
        <Pagination
          ariaLabel="Sample records pagination"
          pageSizeArray={[5, 10, 20, 50]}
          totalResultsNumber={filtered.length}
          pageSize={pageSize}
          setPageSize={setPageSize}
          currentPage={safePage}
          setCurrentPage={setCurrentPage}
        />
      </div>
      <p className="hint">
        Try changing the results-per-page selector, choosing a specific page, using
        First/Previous/Next/Last, or searching to reset to page one. This uses
        the published npm package, not a local copy of its pagination controls.
      </p>
    </section>
  );
}
