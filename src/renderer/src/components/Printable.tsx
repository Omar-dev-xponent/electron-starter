// components/PrintTable.tsx
// PrintTable page — modified to use CSS-driven page breaking.
// No more manual chunkArray — content flows naturally across pages.
// The browser/Electron engine handles pagination automatically.

import React, { useState } from 'react'
import PrintPreviewModal from '../components/PrintPreviewModal'
import type { TableRow, PrintConfig } from '../types/print.types'

// ─── Config ───────────────────────────────────────────────────────────────────
const PRINT_CONFIG: PrintConfig = {
  rowsPerPage: 10, // used only for the screen preview count label
  pageMarginMm: 15,
  pageSize: 'A4',
  landscape: false,
  title: 'Inventory Report'
}

// ─── Sample data ──────────────────────────────────────────────────────────────
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

// ─── PrintableContent ─────────────────────────────────────────────────────────
// This is ONE continuous document — no manual page splitting.
// CSS rules in print.css handle:
//   - thead repeating on every new page  (thead { display: table-header-group })
//   - rows never splitting mid-row        (tr { break-inside: avoid })
//   - section headings staying with body  (h3 + * { break-before: avoid })
//   - summary block staying together      (.print-keep-together)
interface PrintableContentProps {
  data: TableRow[]
  config: PrintConfig
}

const PrintableContent: React.FC<PrintableContentProps> = ({ data, config }) => {
  const inStock = data.filter((r) => r.status === 'In Stock').length
  const outOfStock = data.length - inStock
  const totalValue = data.reduce((sum, r) => sum + r.price * r.stock, 0)

  return (
    <div className="text-xs text-slate-800">
      {/* ── Document header ── */}
      <div className="print-keep-together mb-6 border-b-2 border-slate-800 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{config.title}</h1>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Generated on {new Date().toLocaleDateString()} · {data.length} total records
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <p className="font-semibold text-slate-700">Acme Corp Ltd.</p>
            <p>Internal Use Only · Confidential</p>
          </div>
        </div>
      </div>

      {/* ── Summary cards — stay together, break before if needed ── */}
      <div className="print-keep-together mb-6">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Summary
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Products', value: data.length.toString() },
            { label: 'In Stock', value: inStock.toString(), accent: 'text-emerald-700' },
            { label: 'Out of Stock', value: outOfStock.toString(), accent: 'text-red-600' },
            {
              label: 'Inventory Value',
              value: `$${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
            }
          ].map((card) => (
            <div key={card.label} className="rounded border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] text-slate-400">{card.label}</p>
              <p className={`text-base font-bold ${card.accent ?? 'text-slate-800'}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Category breakdown — keep together ── */}
      <div className="print-keep-together mb-6">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          By Category
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {(['Electronics', 'Clothing', 'Books', 'Food'] as const).map((cat) => {
            const rows = data.filter((r) => r.category === cat)
            return (
              <div key={cat} className="rounded border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] text-slate-400">{cat}</p>
                <p className="text-sm font-bold text-slate-800">{rows.length} items</p>
                <p className="text-[10px] text-slate-400">
                  $
                  {rows
                    .reduce((s, r) => s + r.price * r.stock, 0)
                    .toLocaleString('en-US', { maximumFractionDigits: 0 })}{' '}
                  value
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Main inventory table ──────────────────────────────────────────────
           KEY RULES (from print.css):
           - thead { display: table-header-group } → header repeats on every page
           - tr { break-inside: avoid }            → rows never split mid-row
           - tbody { orphans: 3; widows: 3 }       → no lone rows at top/bottom
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Full Inventory ({data.length} records)
        </h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-800 text-left text-slate-100">
              {['#', 'Product Name', 'Category', 'Price', 'Stock', 'Value', 'Status'].map((h) => (
                <th
                  key={h}
                  className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={row.id}
                className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
              >
                <td className="px-2.5 py-1.5 text-slate-400">{row.id}</td>
                <td className="px-2.5 py-1.5 font-medium text-slate-800">{row.name}</td>
                <td className="px-2.5 py-1.5 text-slate-500">{row.category}</td>
                <td className="px-2.5 py-1.5 text-slate-600">${row.price.toFixed(2)}</td>
                <td className="px-2.5 py-1.5 text-slate-600">{row.stock}</td>
                <td className="px-2.5 py-1.5 text-slate-600">
                  ${(row.price * row.stock).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </td>
                <td className="px-2.5 py-1.5">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
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
      </div>

      {/* ── Out of stock section — force new page before it ──────────────────
           .print-break-before → page-break-before: always in print.css
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="print-break-before">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Out of Stock Items ({outOfStock} records)
        </h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-red-900 text-left text-red-100">
              {['#', 'Product Name', 'Category', 'Last Price', 'Action Required'].map((h) => (
                <th
                  key={h}
                  className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data
              .filter((r) => r.status === 'Out of Stock')
              .map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-red-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-red-50'}`}
                >
                  <td className="px-2.5 py-1.5 text-slate-400">{row.id}</td>
                  <td className="px-2.5 py-1.5 font-medium text-slate-800">{row.name}</td>
                  <td className="px-2.5 py-1.5 text-slate-500">{row.category}</td>
                  <td className="px-2.5 py-1.5 text-slate-600">${row.price.toFixed(2)}</td>
                  <td className="px-2.5 py-1.5">
                    <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      Reorder Required
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ── Document footer — keep together ── */}
      <div className="print-keep-together mt-8 border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>
            {config.title} · Generated {new Date().toLocaleString()}
          </span>
          <span>Confidential · Do not distribute</span>
        </div>
      </div>
    </div>
  )
}

// ─── PrintTable Page ──────────────────────────────────────────────────────────
const PrintTable: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const data = generateData(100)

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* ── Toolbar ── */}
      <div className="mb-8 flex items-center justify-between rounded-2xl bg-white px-6 py-5 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>
          <p className="mt-1 text-sm text-slate-400">
            {data.length} products · Multi-section report with automatic page breaks
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-500 active:scale-95"
        >
          🖨 Open Print View
        </button>
      </div>

      {/* ── Screen table (first 20 rows) ── */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Preview — showing 20 of {data.length} records
          </p>
        </div>
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
          Open Print View for the full multi-section report with automatic page breaks
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
