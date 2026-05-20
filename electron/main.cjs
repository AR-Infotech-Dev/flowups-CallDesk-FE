const { app, BrowserWindow, Tray, Menu } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;

let mainWindow;
let splash;
let tray;

function createWindow() {
  // Splash Screen
  splash = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false,
    alwaysOnTop: true,
    transparent: false,
    resizable: false,
    center: true,
    icon: path.join(__dirname, "./new logo.png")
  });

  splash.loadFile(path.join(__dirname, "splash.html"));

  // Main App
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "./new logo.png"),

    webPreferences: {
      // devTools: false,
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Show main after splash
  mainWindow.once("ready-to-show", () => {
    setTimeout(() => {
      if (splash) splash.close();
      mainWindow.show();
    }, 1500);
  });

  // Minimize to tray on close
  mainWindow.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, "./new logo.png"));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open FlowupS",
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: "Minimize",
      click: () => {
        mainWindow.hide();
      }
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip("FlowupS CRM");
  tray.setContextMenu(contextMenu);

  tray.on("double-click", () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  // mainWindow.webContents.openDevTools();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  // Keep app running in tray on Windows
});