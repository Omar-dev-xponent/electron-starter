// hooks/usePrintPDF.ts
import { useState } from 'react'

export type PdfStatus = 'idle' | 'saving' | 'done' | 'error'

interface UsePrintPDFReturn {
  pdfStatus: PdfStatus
  handlePrint: () => void
  handleSavePDF: (fileName?: string) => Promise<void>
}

export function usePrintPDF(): UsePrintPDFReturn {
  const [pdfStatus, setPdfStatus] = useState<PdfStatus>('idle')

  // ── Print via Electron or browser fallback ──────────────────────────────
  const handlePrint = (): void => {
    if (window.electronAPI?.print) {
      window.electronAPI.print()
    } else {
      window.print()
    }
  }

  // ── Save as PDF via Electron or browser fallback ────────────────────────
  const handleSavePDF = async (fileName = 'document.pdf'): Promise<void> => {
    setPdfStatus('saving')

    if (window.electronAPI?.savePDF) {
      const result = await window.electronAPI.savePDF(fileName)
      setPdfStatus(result.success ? 'done' : 'error')
      setTimeout(() => setPdfStatus('idle'), 3000)
    } else {
      // Browser fallback: triggers print dialog where user can "Save as PDF"
      window.print()
      setPdfStatus('idle')
    }
  }

  return { pdfStatus, handlePrint, handleSavePDF }
}
