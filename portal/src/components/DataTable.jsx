import { useMemo, useState } from 'react';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import './components.css';

export default function DataTable({ columns, rows, rowKey, onRowClick }) {
  const [sort, setSort] = useState(null); // { key, dir: 1 | -1 }

  const sorted = useMemo(() => {
    if (!sort) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sort.key]; const bv = b[sort.key];
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * sort.dir;
    });
  }, [rows, sort]);

  const toggleSort = (key) =>
    setSort((s) => (s?.key === key ? { key, dir: -s.dir } : { key, dir: 1 }));

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.sortable ? 'sortable' : ''}
                onClick={c.sortable ? () => toggleSort(c.key) : undefined}>
                {c.label}
                {sort?.key === c.key && (sort.dir === 1
                  ? <FiChevronUp className="sort-icon" aria-hidden="true" />
                  : <FiChevronDown className="sort-icon" aria-hidden="true" />)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row[rowKey]} className={onRowClick ? 'clickable' : ''}
              onClick={onRowClick ? () => onRowClick(row) : undefined}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
