import { app, shell, BrowserWindow, ipcMain, dialog, PrintToPDFOptions } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import * as fs from 'fs'
import * as path from 'path'

// ── Margins helper (mm → inches, Electron uses inches) ───────────────────────
const mmToInches = (mm: number): number => mm / 25.4

// ── Page config (keep in sync with PrintConfig in your React app) ────────────
const PAGE_MARGIN_MM = 15

// ── IPC: Print (opens system print dialog) ───────────────────────────────────
ipcMain.handle('print', async (): Promise<void> => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return

  win.webContents.print(
    {
      silent: false, // false = show system print dialog
      printBackground: true, // include background colors/images
      color: true
    },
    (success: boolean, errorType?: string) => {
      if (!success) console.error('[Print] Failed:', errorType)
    }
  )
})

// ── IPC: Save as PDF ─────────────────────────────────────────────────────────
ipcMain.handle(
  'save-pdf',
  async (_event, fileName: string = 'report.pdf'): Promise<{ success: boolean; path?: string }> => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { success: false }

    const { filePath, canceled } = await dialog.showSaveDialog(win, {
      title: 'Save PDF',
      defaultPath: fileName,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    })

    if (canceled || !filePath) return { success: false }

    const pdfOptions: PrintToPDFOptions = {
      printBackground: true,
      pageSize: 'A4',
      landscape: false,
      margins: {
        marginType: 'custom',
        top: mmToInches(PAGE_MARGIN_MM),
        bottom: mmToInches(PAGE_MARGIN_MM),
        left: mmToInches(PAGE_MARGIN_MM),
        right: mmToInches(PAGE_MARGIN_MM)
      }
    }

    try {
      const pdfBuffer = await win.webContents.printToPDF(pdfOptions)
      fs.writeFileSync(filePath, pdfBuffer)
      console.log('[PDF] Saved to:', filePath)
      return { success: true, path: filePath }
    } catch (err) {
      console.error('[PDF] Error:', err)
      return { success: false }
    }
  }
)

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
