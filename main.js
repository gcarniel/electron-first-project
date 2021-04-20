const { app, BrowserWindow, Menu, dialog, ipcMain, shell, Notification } = require('electron')
const fs = require('fs')
const path = require('path')

//JANELA PRINCIPAL
var mainWindow = null

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })

    await mainWindow.loadFile('src/pages/editor/index.html')

    createNewFile()

    ipcMain.on('update-content', (event, data) => {
        file.content = data
    })

    // mainWindow.webContents.openDevTools()
}

// ARQUIVO
var file = {}


// verificando se está salvo
async function verifySaveOrCancel() {
    if(file.content != '' && file.saved === false){
        const message = dialog.showMessageBox(mainWindow, {
            type: 'question',
            buttons: ['Sim', 'Não', 'Cancelar'],
            title: 'Salvar',
            message: 'Deseja salvar seu arquivo?',
            noLink: true,
            cancelId: 2,
        })
        const { response } = await message

        if(response === 0) {
            saveFileAs()
            return true
        }

        if(response === 2) {
            return false
        }
        return true
    }
    return true
}

let podeFechar = true
async function verifyClose() {
    const cancel = await verifySaveOrCancel()
    console.log('verifyClose', cancel)

    podeFechar = false
    
    if(cancel === false) return
    
    podeFechar = true
}

// CRIAR NOVO ARQUIVO
async function createNewFile() {
    const cancel = await verifySaveOrCancel()
    console.log('cancel', cancel)
    if(cancel === false) return

    file = {
        name: 'novo-arquivo.txt',
        content: '',
        saved: false,
        path: app.getPath('documents') + '\\novo-arquivo.txt'
    }

    mainWindow.webContents.send('set-file', file)
}

// SALVAR O ARQUIVO
function writeFile(filePath) {
    try {
        fs.writeFile(filePath, file.content, (error) => {
            if (error) throw new Error('Erro ao salvar o arquivo')

            file.path = filePath
            file.saved = true
            file.name = path.basename(filePath)

            console.log(file)

            mainWindow.webContents.send('set-file', file)
        })
    } catch (error) {
        console.log(error)
    }
}

// SALVAR COMO
async function saveFileAs() {
    let dialogFile = await dialog.showSaveDialog({
        defaultPath: file.path
    })

    // verificando se o arquivo foi cancelado ou salvo 
    if (dialogFile.canceled) {
        return false
    }


    writeFile(dialogFile.filePath)
}

// SALVAR
function saveFile() {
    if(file.saved) {
        return writeFile(file.path)
    }

    return saveFileAs()
}

// LER ARQUIVO
function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf-8')
    } catch (error) {
        console.log(error)
        return ''
    }
}

// ABRIR ARQUIVO
async function openFile() {
    let dialogFile = await dialog.showOpenDialog({
        defaultPath: file.path
    })

    if(dialogFile.canceled) {
        return false
    }

    file = {
        name: path.basename(dialogFile.filePaths[0]),
        content: readFile(dialogFile.filePaths[0]),
        saved: true,
        path: dialogFile.filePaths[0]
    }

    mainWindow.webContents.send('set-file', file)
}

// TEMPLATE MENU
const templateMenu = [
    {
        label: 'Arquivo',
        submenu: [
            {
                label: 'Novo',
                accelerator: 'Ctrl+N',
                click() {
                    createNewFile()
                }
            },
            {
                label: 'Abrir',
                accelerator: 'Ctrl+A',
                click() {
                    openFile()
                }
            },
            {
                label: 'Salvar',
                accelerator: 'Ctrl+S',
                click() {
                    saveFile()
                }
            },
            {
                label: 'Salvar Como',
                accelerator: 'Ctrl+Shift+S',
                click() {
                    saveFileAs()
                }
            },
            {
                label: 'Fechar',
                click() {
                    verifyClose()
                },
                accelerator: 'Ctrl+F',
                role: process.platform === 'darwin' ? 'close' : 'quit'
            }
        ]
    },
    {
        label: 'Editar',
        submenu: [
            {
                label: 'Desfazer',
                role: 'undo'
            },
            {
                label: 'Refazer',
                role: 'redo'
            },           
            {
                type: 'separator'
            },
            {
                label: 'Copiar',
                role: 'copy'
            },            
            {
                label: 'Cortar',
                role: 'cut'
            },
            {
                label: 'Colar',
                role: 'paste'
            },
        ]
    },
    {
        label: 'Sobre',
        submenu: [
            {
                label: 'Versão'
            },
            {
                label: 'Ajuda',
                click() {
                    shell.openExternal('https://github.com/gcarniel')
                }
            }
        ]
    }
]

// MENU
const menu = Menu.buildFromTemplate(templateMenu)
Menu.setApplicationMenu(menu)


// ON READ
app.whenReady().then(createWindow)

// ACTIVATE
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})