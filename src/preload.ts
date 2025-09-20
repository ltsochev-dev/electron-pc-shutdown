// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  serverStart: () => ipcRenderer.invoke("server:start"),
  serverStop: () => ipcRenderer.invoke("server:stop"),
  serverInfo: () => ipcRenderer.invoke("get-server-info"),
  systemShutdown: () => ipcRenderer.invoke("system:shutdown"),
  notifyReactReady: () => ipcRenderer.send("react-ready"),
  openExternal: (url: string) => ipcRenderer.send("open-url", url),
  exit: (code: number) => ipcRenderer.send("exit", code),
});
