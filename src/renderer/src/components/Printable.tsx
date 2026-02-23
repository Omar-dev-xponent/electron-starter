// components/PrintTable.tsx
import React, { useState } from 'react'
import PrintPreviewModal from '../components/PrintPreviewModal'
import type { TableRow, PrintConfig } from '../types/print.types'

// ─── Config ───────────────────────────────────────────────────────────────────
const PRINT_CONFIG: PrintConfig = {
  rowsPerPage: 20,
  pageMarginMm: 15,
  pageSize: 'A4',
  landscape: false,
  title: 'Inventory Report'
}

// ─── Sample data (replace with your real data source) ────────────────────────
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

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size))
  return chunks
}

// ─── Printable page content ───────────────────────────────────────────────────
interface PrintableContentProps {
  data: TableRow[]
  config: PrintConfig
}

const PrintableContent: React.FC<PrintableContentProps> = ({ data, config }) => {
  const pages = chunkArray(data, config.rowsPerPage)

  return (
    <>
      {pages.map((pageRows, pageIndex) => (
        // .print-page-card — used by @media print in print.css for page breaks
        <div
          key={pageIndex}
          className="print-page-card relative rounded-md bg-white shadow-md"
          style={{ padding: `${config.pageMarginMm}mm` }}
        >
          {/* Preview-only badge — hidden during print via print.css */}
          <span className="page-number-badge absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-700 px-3 py-0.5 text-[10px] font-semibold tracking-widest text-slate-300">
            Page {pageIndex + 1} of {pages.length}
          </span>

          {/* Page header */}
          <div className="mb-3.5 flex items-center justify-between border-b-2 border-slate-800 pb-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-800">{config.title}</h3>
              <p className="text-[11px] text-slate-400">
                Generated on {new Date().toLocaleDateString()}
              </p>
            </div>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
              {pageIndex + 1} / {pages.length}
            </span>
          </div>

          {/* Table */}
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800 text-left text-slate-100">
                {['#', 'Product Name', 'Category', 'Price', 'Stock', 'Status'].map((h) => (
                  <th
                    key={h}
                    className="px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                >
                  <td className="px-2.5 py-1.5 text-slate-400">{row.id}</td>
                  <td className="px-2.5 py-1.5 font-medium text-slate-800">{row.name}</td>
                  <td className="px-2.5 py-1.5 text-slate-500">{row.category}</td>
                  <td className="px-2.5 py-1.5 text-slate-600">${row.price.toFixed(2)}</td>
                  <td className="px-2.5 py-1.5 text-slate-600">{row.stock}</td>
                  <td className="px-2.5 py-1.5">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
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
          <div className="mt-3 border-t border-slate-100 pt-2 text-right text-[10px] text-slate-300">
            Confidential · Internal Use Only
          </div>
        </div>
      ))}
    </>
  )
}

// ─── PrintTable Page ──────────────────────────────────────────────────────────
const PrintTable: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const data = generateData(100)

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* ── Page toolbar ── */}
      <div className="mb-8 flex items-center justify-between rounded-2xl bg-white px-6 py-5 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>
          <p className="mt-1 text-sm text-slate-400">
            {data.length} products · Open Print View to print or export PDF
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-500 active:scale-95"
        >
          🖨 Open Print View
        </button>
      </div>

      {/* ── Screen table (preview first 20) ── */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-800 text-left text-white">
              {['#', 'Product Name', 'Category', 'Price', 'Stock', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 20).map((row, idx) => (
              <tr
                key={row.id}
                className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
              >
                <td className="px-4 py-2.5 text-slate-400">{row.id}</td>
                <td className="px-4 py-2.5 font-medium text-slate-800">{row.name}</td>
                <td className="px-4 py-2.5 text-slate-600">{row.category}</td>
                <td className="px-4 py-2.5 text-slate-700">${row.price.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-slate-700">{row.stock}</td>
                <td className="px-4 py-2.5">
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
        <p className="px-4 py-3 text-center text-xs text-slate-400">
          Showing 20 of {data.length} · Open Print View to see all{' '}
          {Math.ceil(data.length / PRINT_CONFIG.rowsPerPage)} pages
        </p>
      </div>

      {/* ── Print Preview Modal ── */}
      {isModalOpen && (
        <PrintPreviewModal
          title={PRINT_CONFIG.title}
          fileName="inventory-report.pdf"
          pageSize={PRINT_CONFIG.pageSize}
          pageMarginMm={PRINT_CONFIG.pageMarginMm}
          landscape={PRINT_CONFIG.landscape}
          onClose={() => setIsModalOpen(false)}
        >
          <PrintableContent data={data} config={PRINT_CONFIG} />
        </PrintPreviewModal>
      )}
    </div>
  )
}

export default PrintTable
