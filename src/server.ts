import http from "node:http";
import fs from "fs";
import path from "path";
import { createProxyServer } from "http-proxy";
import os from "os";
import { systemShutdown } from "./lib/electron";

let server: http.Server | null = null;
let startedAt = 0;

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

export const PORT = 1339;
export const HOST = getIpAddress();

const isDev = process.env.NODE_ENV !== "production";
const staticDir = path.join(__dirname, ".vite/build/web");
const proxy = createProxyServer({
  target: WEB_VITE_DEV_SERVER_URL,
  changeOrigin: true,
});

const startServer = () => {
  server = http.createServer((req, res) => {
    if (req.method === "POST" && req.url === "/api/shutdown") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", shuttingDown: true }));

      return systemShutdown();
    }

    if (isDev) {
      proxy.web(req, res, (err) => {
        console.error("Proxy error:", err);
        res.writeHead(502);
        res.end("Bad gateway");
      });
    } else {
      let filePath = path.join(staticDir, req.url || "index.html");
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(staticDir, "index.html");
      }
      const content = fs.readFileSync(filePath);
      res.writeHead(200);
      res.end(content);
    }
  });

  server.listen(PORT, HOST, () => {
    startedAt = Date.now();
    console.log(`SPA Server running on http://${HOST}:${PORT}`);
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
