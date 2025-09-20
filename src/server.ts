import http from "node:http";
import fs from "fs";
import path from "path";
import { createProxyServer } from "http-proxy";
import os from "os";
import { systemShutdown } from "./lib/electron";
import { app } from "electron";
import mime from "mime";
import { exec } from "node:child_process";

let server: http.Server | null = null;
let startedAt = 0;

export const getIpAddress = async (): Promise<string> => {
  if (process.platform === "win32") {
    const ipList = await getWindowsIpAddress();
    return ipList[0] ?? "127.0.0.1";
  }

  return new Promise((resolve, reject) => {
    const nets = os.networkInterfaces();

    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === "IPv4" && !net.internal) {
          return resolve(net.address);
        }
      }
    }

    return reject("No IP addresses found on the network interfaces.");
  });
};

const getWindowsIpAddress = async (): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    // PowerShell command to get IPv4 addresses assigned via DHCP
    const cmd = `powershell -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.PrefixOrigin -eq 'Dhcp' } | Select-Object -ExpandProperty IPAddress"`;

    exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      const ips = stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      resolve(ips);
    });
  });
};

export const PORT = 1339;

const isDev = app.isPackaged !== true;
const staticDir = path.join(__dirname, "../renderer/web");

const proxy =
  isDev &&
  createProxyServer({
    target: WEB_VITE_DEV_SERVER_URL,
    changeOrigin: true,
  });

const startServer = async () => {
  server = http.createServer(async (req, res) => {
    if (req.method === "POST" && req.url === "/api/shutdown") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", shuttingDown: true }));

      return systemShutdown();
    }

    if (req.url === "/api/info") {
      const infoObj = {
        ipAddress: (await getIpAddress()) ?? "192.168.0.100",
        port: PORT,
        connections: 1,
        startedAt: getServerStartedAt(),
        isRunning: getServer() !== null,
      };
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ status: "ok", data: infoObj }));
    }

    if (isDev) {
      proxy.web(req, res, undefined, (err) => {
        console.error("Proxy error:", err);
        res.writeHead(502);
        res.end("Bad gateway");
      });
    } else {
      let filePath = path.join(staticDir, req.url || "index.html");
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(staticDir, "index.html");
      }
      const ext = path.extname(filePath).toLowerCase();
      const type = mime.getType(ext) || "application/octet-stream";
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { "content-type": type });
      res.end(content);
    }
  });

  const hostname = await getIpAddress();

  server.listen(PORT, hostname, () => {
    startedAt = Date.now();
    console.log(`SPA Server running on http://${hostname}:${PORT}`);
    console.log(`Serving from: ${isDev ? WEB_VITE_DEV_SERVER_URL : staticDir}`);
  });

  return true;
};

const stopServer = async () => {
  if (!server) return false;

  server.closeAllConnections();

  await server.close();

  server = null;

  return true;
};

const getServer = () => server;
const getServerStartedAt = () => startedAt;

export { startServer, stopServer, getServer, getServerStartedAt };
