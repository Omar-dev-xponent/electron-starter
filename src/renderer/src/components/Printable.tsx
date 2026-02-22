// components/PrintTable.tsx
import React, { useState } from 'react'
import type { TableRow, PrintConfig } from '../types/print.types'

// ─── Default config — tweak these values ─────────────────────────────────────
const DEFAULT_CONFIG: PrintConfig = {
  rowsPerPage: 10, // rows per printed page
  pageMarginMm: 15, // page margin in mm (must match main.ts)
  pageSize: 'A4',
  landscape: false,
  title: 'Inventory Report'
}

// ─── Sample data generator (replace with your real data/props) ───────────────
function generateData(count: number): TableRow[] {
  const categories = ['Electronics', 'Clothing', 'Books', 'Food'] as const
  const statuses = ['In Stock', 'Out of Stock'] as const

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Product ${String(i + 1).padStart(3, '0')}`,
    category: categories[i % categories.length],
    price: parseFloat((Math.random() * 490 + 10).toFixed(2)),
    stock: Math.floor(Math.random() * 200),
    status: i % 7 === 0 ? statuses[1] : statuses[0]
  }))
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// ─── Sub-components ──────────────────────────────────────────────────────────
interface PageProps {
  rows: TableRow[]
  pageNumber: number
  totalPages: number
  config: PrintConfig
  isLast: boolean
}

const TablePage: React.FC<PageProps> = ({ rows, pageNumber, totalPages, config, isLast }) => (
  <div
    className="print-page bg-white"
    style={{
      padding: `${config.pageMarginMm}mm`,
      marginBottom: '24px',
      pageBreakAfter: isLast ? 'avoid' : 'always',
      breakAfter: isLast ? 'avoid' : 'page'
    }}
  >
    {/* Page header */}
    <div className="mb-4 flex items-center justify-between border-b-2 border-slate-800 pb-3">
      <div>
        <h2 className="text-base font-bold text-slate-800">{config.title}</h2>
        <p className="text-xs text-slate-400">Generated on {new Date().toLocaleDateString()}</p>
      </div>
      <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
        Page {pageNumber} / {totalPages}
      </span>
    </div>

    {/* Table */}
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="bg-slate-800 text-left text-white">
          {['#', 'Product Name', 'Category', 'Price', 'Stock', 'Status'].map((h) => (
            <th key={h} className="px-3 py-2 text-xs font-semibold uppercase tracking-wider">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr
            key={row.id}
            className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
          >
            <td className="px-3 py-2 text-slate-400">{row.id}</td>
            <td className="px-3 py-2 font-medium text-slate-800">{row.name}</td>
            <td className="px-3 py-2 text-slate-600">{row.category}</td>
            <td className="px-3 py-2 text-slate-700">${row.price.toFixed(2)}</td>
            <td className="px-3 py-2 text-slate-700">{row.stock}</td>
            <td className="px-3 py-2">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                  row.status === 'In Stock'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {row.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Page footer */}
    <div className="mt-4 border-t border-slate-100 pt-2 text-right text-xs text-slate-300">
      Confidential · Internal Use Only
    </div>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────
interface PrintTableProps {
  data?: TableRow[] // pass your own data, or leave blank for sample
  config?: Partial<PrintConfig>
}

const PrintTable: React.FC<PrintTableProps> = ({
  data = generateData(100),
  config: configOverrides = {}
}) => {
  const config: PrintConfig = { ...DEFAULT_CONFIG, ...configOverrides }
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')

  const pages = chunkArray(data, config.rowsPerPage)

  // ── Print — no useCallback, React Compiler handles memoization ──────────────
  const handlePrint = (): void => {
    if (window.electronAPI?.print) {
      window.electronAPI.print()
    } else {
      window.print()
    }
  }

  // ── Save PDF — no useCallback, React Compiler handles memoization ──────────
  const handleSavePDF = async (): Promise<void> => {
    setPdfStatus('saving')

    if (window.electronAPI?.savePDF) {
      const fileName = `${config.title.replace(/\s+/g, '-').toLowerCase()}.pdf`
      const result = await window.electronAPI.savePDF(fileName)
      setPdfStatus(result.success ? 'done' : 'error')
      setTimeout(() => setPdfStatus('idle'), 3000)
    } else {
      window.print()
      setPdfStatus('idle')
    }
  }

  // ── PDF button label ───────────────────────────────────────────────────────
  const pdfLabel: Record<typeof pdfStatus, string> = {
    idle: '⬇️ Save PDF',
    saving: 'Saving…',
    done: '✅ Saved!',
    error: '❌ Failed'
  }

  return (
    <>
      {/* ── Print CSS ─────────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }

          .print-page {
            margin: 0 !important;
            box-shadow: none !important;
          }

          @page {
            size: ${config.pageSize} ${config.landscape ? 'landscape' : 'portrait'};
            margin: ${config.pageMarginMm}mm;
          }
        }
      `}</style>

      <div className="min-h-screen bg-slate-100 p-6">
        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white px-6 py-4 shadow-lg">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{config.title}</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              <span className="font-medium text-slate-600">{data.length}</span> records ·{' '}
              <span className="font-medium text-slate-600">{pages.length}</span> pages ·{' '}
              <span className="font-medium text-slate-600">{config.rowsPerPage}</span> rows/page ·{' '}
              margin <span className="font-medium text-slate-600">{config.pageMarginMm}mm</span>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
            >
              🖨️ Print
            </button>
            <button
              onClick={handleSavePDF}
              disabled={pdfStatus === 'saving'}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-95 ${
                pdfStatus === 'done'
                  ? 'bg-emerald-600'
                  : pdfStatus === 'error'
                    ? 'bg-red-600'
                    : 'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60'
              }`}
            >
              {pdfLabel[pdfStatus]}
            </button>
          </div>
        </div>

        {/* ── Printable pages ─────────────────────────────────────────────── */}
        <div id="printable">
          {pages.map((pageRows, pageIndex) => (
            <TablePage
              key={pageIndex}
              rows={pageRows}
              pageNumber={pageIndex + 1}
              totalPages={pages.length}
              config={config}
              isLast={pageIndex === pages.length - 1}
            />
          ))}
        </div>
      </div>
    </>
  )
}

export default PrintTable
