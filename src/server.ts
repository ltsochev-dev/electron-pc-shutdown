import http from "node:http";
import fs from "fs";
import path from "path";
import { createProxyServer } from "http-proxy";
import os from "os";
import { systemShutdown } from "./lib/electron";
import { app } from "electron";
import mime from "mime";
import { exec } from "node:child_process";
import { Server } from "node-ssdp";

let server: http.Server | null = null;
let ssdpServer: Server | null = null;
let startedAt = 0;

const startSsdpServer = async (): Promise<void> => {
  if (ssdpServer) return;

  const ipAddr = await getIpAddress();
  const serverAddr = `http://${ipAddr}:${PORT}`;

  ssdpServer = new Server({
    location: `${serverAddr}/description.xml`,
    udn: "uuid:remote-control-app",
  });

  ssdpServer.addUSN("urn:schemas-upnp-org:service:RemotePcApp:1");

  // Log when a discovery request is received
  ssdpServer.on("advertise-alive", (headers) => {
    console.log("Device/service is alive:", headers);
  });

  ssdpServer.on("advertise-bye", (headers) => {
    console.log("Device/service going offline:", headers);
  });

  const res = ssdpServer.start();
  if (typeof res === "object" && "then" in res && "catch" in res) {
    return res
      .then(() => {
        console.log("SSDP server started broadcasting.");
      })
      .catch((err) => {
        console.log("failed to start SSDP server");
        console.error(err);
        throw err;
      });
  }

  return res;
};

const stopSsdpServer = () => {
  if (!ssdpServer) return;

  ssdpServer.stop();

  ssdpServer = null;

  console.log("Service broadcasting stopped.");
};

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

    if (req.url === "/description.xml") {
      const xmlResponse = await generateSsdpDescription();
      res.writeHead(200, { "content-type": "text/xml" });
      return res.end(xmlResponse);
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

    startSsdpServer();
  });

  return true;
};

const stopServer = async () => {
  if (!server) return false;

  stopSsdpServer();

  server.closeAllConnections();

  await server.close();

  server = null;

  return true;
};

const getServer = () => server;
const getServerStartedAt = () => startedAt;

export { startServer, stopServer, getServer, getServerStartedAt };

const generateSsdpDescription = async (): Promise<string> => {
  const ipAddr = await getIpAddress();
  const serverAddr = `http://${ipAddr}:${PORT}`;
  return `<?xml version="1.0"?>
<root xmlns="urn:schemas-upnp-org:device-1-0">
  <specVersion>
    <major>1</major>
    <minor>0</minor>
  </specVersion>

  <device>
    <deviceType>urn:schemas-upnp-org:device:RemotePcApp:1</deviceType>
    <friendlyName>Remote PC Control</friendlyName>
    <manufacturer>LTsochev IT</manufacturer>
    <modelName>RemotePC</modelName>
    <UDN>uuid:remote-control-app</UDN>
    
    <!-- Optional: define a service -->
    <serviceList>
      <service>
        <serviceType>urn:schemas-upnp-org:service:RemotePcApp:1</serviceType>
        <serviceId>urn:upnp-org:serviceId:ShutdownService</serviceId>
        <controlURL>/</controlURL>
        <eventSubURL>/events</eventSubURL>
      </service>
    </serviceList>
    <presentationURL>${serverAddr}</presentationURL>
  </device>
</root>
`;
};
