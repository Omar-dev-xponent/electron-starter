export interface TableRow {
  id: number
  name: string
  category: string
  price: number
  stock: number
  status: 'In Stock' | 'Out of Stock'
}

export interface PrintConfig {
  rowsPerPage: number
  pageMarginMm: number
  pageSize: 'A4' | 'Letter' | 'Legal'
  landscape: boolean
  title: string
}

export interface ElectronAPI {
  print: () => Promise<void>
  savePDF: (fileName?: string) => Promise<{ success: boolean; path?: string }>
}

// Extend Window to include electronAPI (injected by preload)
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
