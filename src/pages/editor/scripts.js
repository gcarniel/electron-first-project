const { ipcRenderer } = require('electron')

// ELEMENTOS
const textArea = document.getElementById('text')
const title = document.getElementById('title')


// CHAMANDO SET FILE
ipcRenderer.on('set-file', (event, data) => {
    textArea.focus()
    textArea.value = data.content
    title.textContent = `${data.name} | Notas`
})

// EDITANDO TEXTAREA
function handleChangeText() {
    ipcRenderer.send('update-content', textArea.value)
}