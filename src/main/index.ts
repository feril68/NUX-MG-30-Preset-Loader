import { app, shell, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as Midi from '@julusian/midi'

const DEBUG_MIDI = process.env.DEBUG_MIDI === '1'

if (process.platform === 'win32') {
  app.commandLine.appendSwitch('enable-features', 'MidiManagerWinrt')
}

const icon = join(__dirname, '../../resources/icon.png')

let nativeOutput: InstanceType<typeof Midi.Output> | null = null

function listNativeMidiPorts(): { inputs: string[]; outputs: string[] } {
  const input = new Midi.Input()
  const output = new Midi.Output()

  const inputs = Array.from({ length: input.getPortCount() }, (_, index) =>
    input.getPortName(index)
  )
  const outputs = Array.from({ length: output.getPortCount() }, (_, index) =>
    output.getPortName(index)
  )

  return { inputs, outputs }
}

function closeNativeOutput(): void {
  if (!nativeOutput) return

  try {
    nativeOutput.closePort()
  } catch (error) {
    console.warn('[MIDI] native close failed', error)
  }

  nativeOutput = null
}

function connectNativeOutput(targetName = 'MG-30'): {
  connected: boolean
  selectedOutput: string | null
  inputs: string[]
  outputs: string[]
} {
  const ports = listNativeMidiPorts()
  const normalizedTarget = targetName.toLowerCase()
  const outputIndex = ports.outputs.findIndex((name) =>
    name.toLowerCase().includes(normalizedTarget)
  )

  closeNativeOutput()

  if (outputIndex === -1) {
    return {
      connected: false,
      selectedOutput: null,
      inputs: ports.inputs,
      outputs: ports.outputs
    }
  }

  nativeOutput = new Midi.Output()
  nativeOutput.openPort(outputIndex)

  return {
    connected: true,
    selectedOutput: ports.outputs[outputIndex],
    inputs: ports.inputs,
    outputs: ports.outputs
  }
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
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
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  const isMidiPermission = (permission: string): boolean => {
    return permission.toLowerCase().includes('midi')
  }
  let hasLoggedMidiPermission = false

  if (process.platform === 'win32') {
    if (DEBUG_MIDI) {
      console.log('[MIDI] disable-features:', app.commandLine.getSwitchValue('disable-features'))
      console.log('[MIDI] enable-features:', app.commandLine.getSwitchValue('enable-features'))
    }
  }

  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      const allowed = isMidiPermission(permission)
      if (allowed && !hasLoggedMidiPermission && DEBUG_MIDI) {
        hasLoggedMidiPermission = true
        const detailRecord = details as unknown as Record<string, unknown>
        console.log('[MIDI] permission-request', {
          permission,
          details,
          requestingOrigin: detailRecord.requestingOrigin,
          securityOrigin: detailRecord.securityOrigin,
          mediaTypes: detailRecord.mediaTypes,
          url: webContents?.getURL()
        })
      }

      if (allowed) {
        callback(true)
        return
      }
      callback(false)
    }
  )

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

  ipcMain.handle('midi:native-list', () => {
    const ports = listNativeMidiPorts()
    if (DEBUG_MIDI) {
      console.log('[MIDI] native-list', ports)
    }
    return ports
  })

  ipcMain.handle('midi:native-connect', (_, targetName: string) => {
    const result = connectNativeOutput(targetName)
    if (DEBUG_MIDI) {
      console.log('[MIDI] native-connect', result)
    }
    return result
  })

  ipcMain.on('midi:native-send', (_, data: number[]) => {
    if (!nativeOutput) return
    nativeOutput.sendMessage(data)
  })

  ipcMain.handle(
    'ollama:generate',
    async (
      _,
      payload: { model: string; prompt: string; stream?: boolean; format?: 'json' }
    ): Promise<{ response: string }> => {
      const result = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...payload,
          stream: payload.stream ?? false
        })
      })

      if (!result.ok) {
        const errorText = await result.text()
        throw new Error(`Ollama API error ${result.status}: ${errorText}`)
      }

      const data = (await result.json()) as { response?: string }

      if (!data.response) {
        throw new Error('Ollama API returned empty response')
      }

      return {
        response: data.response
      }
    }
  )

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
  closeNativeOutput()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
