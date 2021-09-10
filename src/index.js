const { app, BrowserWindow } = require('electron');
const {ipcMain} = require('electron');
const path = require('path');
const Tail = require('better-tail')
const fs = require('fs');

let monitorRunning = false;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  //mainWindow.setMenu(null)
  mainWindow.setMinimumSize(500, 400)
  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('asynchronous-message', async (event, arg) => {
  switch (arg.type) {
    case "submitpath":
      startMonitor(event, arg)
    break
  }

  // Event emitter for sending asynchronous messages
  //
})

// Event handler for synchronous incoming messages
ipcMain.on('synchronous-message', (event, arg) => {
  console.log(arg) 

  // Synchronous event emmision
  //event.returnValue = 'sync pong'
})

function startMonitor(event, arg) {
  let path = arg.content
  let files
  // Validate Folder
  try {
    files = fs.readdirSync(path)
    event.sender.send('asynchronous-reply', 'validpath')
  } catch {
    console.log("invalidpath")
    return event.sender.send('asynchronous-reply', 'invalidpath')
  }
  // Validate Netlog Files
  let containsNetlogs = false
  let fileTimestamps = []
  for (let fileName of files) {
    if (fileName.includes("netLog")) { containsNetlogs = true }
    fileTimestamps.push(parseInt(fileName.split('.')[1]))
  }
  if (containsNetlogs === false) { return event.sender.send('asynchronous-reply', 'netlogsmissing') }
  // Get Newest Netlog
  let newestFileTimestamp = Math.max.apply(null, fileTimestamps)
  let watchFile
  for (let fileName of files) {
    if (fileName.includes(`${newestFileTimestamp}`)) {
      watchFile = fileName
    }
  }
  let netlogPath = path + "\\" + watchFile
  event.sender.send('asynchronous-reply', 'monitoringnetlog')
  // Monitor Netlog File
  console.log(`Watching for changes to ${netlogPath}`)
  const tail = new Tail(netlogPath, { follow: true, lines: 1 })
  monitorRunning = true;
  tail.on('line', function (line) {
    console.log(line)
  }).on('error', function (err) {
    console.error(err)
  })
}