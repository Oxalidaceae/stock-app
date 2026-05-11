import type { ReactNode } from 'react'

interface Column<T> {
  key: string
  label: string
  render?: (row: T) => ReactNode
  align?: 'left' | 'right'
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  emptyMessage?: string
}

export function DataTable<T>({ columns, data, onRowClick, emptyMessage = '데이터가 없습니다' }: Props<T>) {
  if (!data.length) {
    return <div className="empty-state">{emptyMessage}</div>
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} className={col.align === 'right' ? 'num' : ''}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr
            key={i}
            onClick={() => onRowClick?.(row)}
            style={onRowClick ? { cursor: 'pointer' } : undefined}
          >
            {columns.map((col) => (
              <td key={col.key} className={col.align === 'right' ? 'num' : ''}>
                {col.render
                  ? col.render(row)
                  : String((row as Record<string, unknown>)[col.key] ?? '—')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
