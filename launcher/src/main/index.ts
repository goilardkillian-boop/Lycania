import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { IPC } from '@shared/types'
import { registerIpcHandlers } from './ipc/register'
import { authManager } from './gameState'
import { initAutoUpdate } from './update/autoUpdate'

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

let mainWindow: BrowserWindow | undefined

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 740,
    minWidth: 960,
    minHeight: 600,
    show: false,
    backgroundColor: '#0b0507',
    autoHideMenuBar: true,
    icon: join(__dirname, '../../build/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()

  authManager.restorePersistedSession().catch(() => {
    // Failure just means the user starts from the sign-in screen; auth state was already updated.
  })

  if (app.isPackaged) {
    initAutoUpdate({
      onAvailable: (version) => mainWindow?.webContents.send(IPC.updateOnAvailable, version),
      onProgress: (percent) => mainWindow?.webContents.send(IPC.updateOnProgress, percent),
      onDownloaded: (version) => mainWindow?.webContents.send(IPC.updateOnDownloaded, version)
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
