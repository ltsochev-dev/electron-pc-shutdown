import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Clock,
  Power,
  RotateCcw,
  Search,
  Server,
  Smartphone,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";

type ConnectionState = "scanning" | "connecting" | "connected" | "disconnected";

interface LastKnownServer {
  address: string;
  name: string;
  lastConnected: string;
}

function FrontendApp() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [scanProgress, setScanProgress] = useState(0);
  const [lastKnownServer, setLastKnownServer] =
    useState<LastKnownServer | null>(null);
  const [serverInfo, setServerInfo] = useState({
    address: "192.168.1.100:3000",
    name: "Local Server",
    uptime: "2h 15m",
    status: "Running",
  });

  useEffect(() => {
    const stored = localStorage.getItem("lastKnownServer");
    if (stored) {
      try {
        setLastKnownServer(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse last known server:", error);
      }
    }
  }, []);

  const saveLastKnownServer = (server: { address: string; name: string }) => {
    const lastKnown: LastKnownServer = {
      address: server.address,
      name: server.name,
      lastConnected: new Date().toLocaleString(),
    };
    setLastKnownServer(lastKnown);
    localStorage.setItem("lastKnownServer", JSON.stringify(lastKnown));
  };

  const handleConnectToLastKnown = () => {
    if (!lastKnownServer) return;

    setConnectionState("connecting");

    setTimeout(() => {
      setConnectionState("connected");
      setServerInfo((prev) => ({
        ...prev,
        address: lastKnownServer.address,
        name: lastKnownServer.name,
      }));
      saveLastKnownServer({
        address: lastKnownServer.address,
        name: lastKnownServer.name,
      });
    }, 1500);
  };

  const handleScan = () => {
    setConnectionState("scanning");
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setConnectionState("connecting");

          setTimeout(() => {
            setConnectionState("connected");
            saveLastKnownServer({
              address: serverInfo.address,
              name: serverInfo.name,
            });
          }, 1500);

          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleDisconnect = () => {
    setConnectionState("disconnected");
    setScanProgress(0);
  };

  const handleShutdown = async () => {
    setServerInfo((prev) => ({ ...prev, status: "Shutting down..." }));
    setTimeout(() => {
      setConnectionState("disconnected");
      setServerInfo((prev) => ({ ...prev, status: "Stopped", uptime: "0m" }));
    }, 2000);

    try {
      const res = await fetch("/api/shutdown", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Something went wrong with the request.", {
          cause: res,
        });
      }

      const json = await res.json();
      console.log({ json });
    } catch (e) {
      console.error(e);
    }
  };

  const getConnectionIcon = () => {
    switch (connectionState) {
      case "connected":
        return <Wifi className="h-6 w-6 text-success" />;
      case "scanning":
      case "connecting":
        return <Search className="h-6 w-6 text-warning animate-pulse" />;
      default:
        return <WifiOff className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getConnectionStatus = () => {
    switch (connectionState) {
      case "scanning":
        return "Scanning for servers...";
      case "connecting":
        return "Connecting to server...";
      case "connected":
        return "Connected to server";
      default:
        return "Not connected";
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <Smartphone className="h-5 w-5 text-success" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Mobile Client
              </h1>
              <p className="text-sm text-muted-foreground">
                Connect to your server
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {connectionState === "disconnected" && lastKnownServer && (
            <Card className="border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-primary" />
                  Last Known Server
                </CardTitle>
                <CardDescription>
                  Quickly reconnect to your previous server
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {lastKnownServer.name}
                    </span>
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {lastKnownServer.address}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Last connected: {lastKnownServer.lastConnected}
                  </div>
                </div>
                <Button
                  onClick={handleConnectToLastKnown}
                  className="w-full bg-transparent"
                  variant="outline"
                  disabled={connectionState !== "disconnected"}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reconnect
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-muted rounded-full w-fit">
                {getConnectionIcon()}
              </div>
              <CardTitle className="text-lg">{getConnectionStatus()}</CardTitle>
              <CardDescription>
                {connectionState === "connected"
                  ? `Connected to ${serverInfo.address}`
                  : "Tap scan to find available servers"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectionState === "scanning" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Scanning network...</span>
                    <span>{scanProgress}%</span>
                  </div>
                  <Progress value={scanProgress} className="h-2" />
                </div>
              )}

              {connectionState === "connecting" && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">
                    Establishing connection...
                  </p>
                </div>
              )}

              {connectionState === "disconnected" && (
                <Button onClick={handleScan} className="w-full" size="lg">
                  <Search className="h-4 w-4 mr-2" />
                  Scan for Servers
                </Button>
              )}

              {connectionState === "connected" && (
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className="w-full bg-transparent"
                >
                  <WifiOff className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              )}
            </CardContent>
          </Card>

          {connectionState === "connected" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Server Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Server Name</span>
                    <span className="text-sm text-muted-foreground">
                      {serverInfo.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Address</span>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {serverInfo.address}
                    </code>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge
                      variant={
                        serverInfo.status === "Running"
                          ? "default"
                          : "secondary"
                      }
                      className={
                        serverInfo.status === "Running"
                          ? "bg-success text-success-foreground"
                          : ""
                      }
                    >
                      {serverInfo.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="text-sm text-muted-foreground">
                      {serverInfo.uptime}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {connectionState === "connected" &&
            serverInfo.status === "Running" && (
              <Card className="border-destructive/20">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-destructive flex items-center justify-center gap-2">
                    <Power className="h-5 w-5" />
                    Server Control
                  </CardTitle>
                  <CardDescription>
                    Safely shutdown the remote server
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleShutdown}
                    variant="destructive"
                    className="w-full"
                    size="lg"
                    disabled={serverInfo.status === "Shutting down..."}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    {serverInfo.status === "Shutting down..."
                      ? "Shutting Down..."
                      : "Shutdown Server"}
                  </Button>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}

export default FrontendApp;
