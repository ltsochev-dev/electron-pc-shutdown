import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import os from "os";
import started from "electron-squirrel-startup";
import { ServerInfo } from "globals";
import {
  getServer,
  getServerStartedAt,
  PORT,
  startServer,
  stopServer,
} from "./server";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const isDev = process.env.NODE_ENV === "development";

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  ipcMain.on("react-ready", () => {
    mainWindow.show();
  });

  ipcMain.handle("get-server-info", () => {
    const getIpAddress = () => {
      const nets = os.networkInterfaces();

      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          // Skip internal (127.0.0.1) and non-ipv4
          if (net.family === "IPv4" && !net.internal) {
            return net.address;
          }
        }
      }

      return null;
    };

    ipcMain.on("exit", (_, code: number) => {
      console.log("Exiting with code %d from app", code);
      process.exit(code);
    });

    return {
      ipAddress: getIpAddress() ?? "192.168.0.100",
      port: PORT,
      connections: 0,
      startedAt: getServerStartedAt(),
      isRunning: getServer() !== null,
    } as ServerInfo;
  });

  ipcMain.handle("server:start", async () => {
    const server = getServer();
    if (server) return true;

    return startServer();
  });

  ipcMain.handle("server:stop", async () => {
    const server = getServer();
    if (!server) return true;

    return stopServer();
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
