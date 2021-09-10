const {ipcRenderer} = require('electron')
const submitButton = document.getElementById('submitBtn');
const responseText = document.getElementById('response');

submitButton.addEventListener('click', function() {
    let path = document.getElementById('pathField').value
    let message = {
        type: "submitpath",
        content: path
    }
    ipcRenderer.send('asynchronous-message', message)
}, false);

// Async message handler
ipcRenderer.on('asynchronous-reply', (event, arg) => {
    console.log(arg)
    switch (arg) {
        case "monitoringnetlog":
            responseText.innerHTML = "Netlogs Found";
            responseText.style.color = "#a3ff75";
        break 
        case "invalidpath":
            responseText.innerHTML = "Invalid Folder Path";
            responseText.style.color = "#ff7775";
        break 
    }
})