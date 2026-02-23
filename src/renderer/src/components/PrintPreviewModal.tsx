// components/PrintPreviewModal.tsx
//
// Reusable print & PDF popup. Accepts any children as printable content.
// Content flows naturally — CSS handles all page breaking automatically.
//
// ─── USAGE ───────────────────────────────────────────────────────────────────
//
//   <PrintPreviewModal
//     title="Q3 Sales Report"
//     fileName="q3-sales.pdf"
//     pageSize="A4"
//     pageMarginMm={15}
//     onClose={() => setOpen(false)}
//   >
//     <MyReportContent />   {/* any size — pages break automatically */}
//   </PrintPreviewModal>
//
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { usePrintPDF, type PdfStatus } from '../hooks/usePrintPDF'

export interface PrintPreviewModalProps {
  /** Shown in the modal header */
  title?: string
  /** Default filename for Save PDF dialog */
  fileName?: string
  /** Paper size passed to @page */
  pageSize?: 'A4' | 'Letter' | 'Legal'
  /** Page margin in mm — synced with Electron's printToPDF margins */
  pageMarginMm?: number
  /** Landscape orientation */
  landscape?: boolean
  /** Called on ✕ click or Escape key */
  onClose: () => void
  /** Printable content — any size, pages break automatically */
  children: React.ReactNode
}

const PDF_LABEL: Record<PdfStatus, string> = {
  idle: '⬇ Save PDF',
  saving: 'Saving…',
  done: '✅ Saved!',
  error: '❌ Failed'
}

const PDF_BTN_COLOR: Record<PdfStatus, string> = {
  idle: 'bg-indigo-600 hover:bg-indigo-500',
  saving: 'bg-indigo-400 cursor-not-allowed',
  done: 'bg-emerald-600',
  error: 'bg-red-600'
}

const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  title = 'Print Preview',
  fileName = 'document.pdf',
  pageSize = 'A4',
  pageMarginMm = 15,
  landscape = false,
  onClose,
  children
}) => {
  const { pdfStatus, handlePrint, handleSavePDF } = usePrintPDF()

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Dynamic @page rule — drives both Print and printToPDF margin/size
  // This overrides the default in print.css
  const pageRule = `
    @media print {
      @page {
        size: ${pageSize} ${landscape ? 'landscape' : 'portrait'};
        margin: ${pageMarginMm}mm;
      }
    }
  `

  // ── Print portal ──────────────────────────────────────────────────────────
  // Rendered directly in <body>, hidden on screen.
  // When Electron calls webContents.print(), print.css hides everything else
  // and makes only #print-root visible — so exactly this content gets printed.
  const printPortal = createPortal(
    <div id="print-root" style={{ display: 'none' }}>
      <style>{pageRule}</style>
      {children}
    </div>,
    document.body
  )

  return (
    <>
      {/* Inject dynamic @page rule for the preview <style> tag too */}
      <style>{pageRule}</style>

      {/* Hidden print portal */}
      {printPortal}

      {/* ── Modal overlay ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
        className="animate-overlay-in fixed inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto bg-black/60 p-6 backdrop-blur-sm"
      >
        {/* Modal shell */}
        <div className="animate-modal-in w-full max-w-4xl overflow-hidden rounded-2xl bg-slate-100 shadow-2xl">
          {/* ── Header ── */}
          <div className="flex items-center justify-between bg-slate-800 px-5 py-3.5">
            <h2 className="text-sm font-semibold tracking-wide text-slate-100">🖨 {title}</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                {pageSize} · {pageMarginMm}mm margin · {landscape ? 'Landscape' : 'Portrait'}
              </span>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-700 hover:text-slate-100 active:scale-95"
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* ── Scrollable preview ── */}
          {/* This is the on-screen preview — content scrolls naturally here.  */}
          {/* The actual print comes from #print-root portal, not this div.    */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto bg-slate-200 p-6">
            {/* Paper-like container — simulates A4 in the preview */}
            <div
              className="mx-auto w-full max-w-3xl bg-white shadow-lg"
              style={{ padding: `${pageMarginMm}mm` }}
            >
              {children}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between bg-slate-800 px-5 py-3.5">
            <span className="text-xs text-slate-400">
              Press <kbd className="rounded bg-slate-700 px-1.5 py-0.5 text-slate-300">Esc</kbd> to
              close
            </span>
            <div className="flex gap-2.5">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-800 transition hover:bg-white active:scale-95"
              >
                🖨 Print
              </button>
              <button
                onClick={() => handleSavePDF(fileName)}
                disabled={pdfStatus === 'saving'}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-60 ${PDF_BTN_COLOR[pdfStatus]}`}
              >
                {PDF_LABEL[pdfStatus]}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PrintPreviewModal
