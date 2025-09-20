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
import { Toaster } from "@/components/ui/sonner";
import { useFormatTimeSince } from "@/hooks/useFormatTimeSince";
import { Power, Search, Server, Smartphone, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type ConnectionState = "scanning" | "connecting" | "connected" | "disconnected";

function FrontendApp() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [scanProgress, setScanProgress] = useState(0);
  const [serverInfo, setServerInfo] = useState({
    ipAddress: "192.168.0.100",
    port: 3000,
    connections: 0,
    startedAt: 0,
    isRunning: false,
  });
  const uptimeStr = useFormatTimeSince(serverInfo.startedAt);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchServerInfo = async () => {
      const res = await fetch("/api/info", { signal: abortController.signal });
      if (!res.ok) {
        toast.error("Something went wrong fetching info about the server.");
      }

      const { data } = await res.json();
      setServerInfo(data);
    };

    fetchServerInfo();

    return () => abortController.abort("useEffect unmount");
  }, []);

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
      if ("status" in json && json.status === "ok") {
        toast.success("Command send successfully");
      }
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
          <Card>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-muted rounded-full w-fit">
                {getConnectionIcon()}
              </div>
              <CardTitle className="text-lg">{getConnectionStatus()}</CardTitle>
              <CardDescription>
                {connectionState === "connected"
                  ? `Connected to ${serverInfo.ipAddress}`
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
                      Local server
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Address</span>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {serverInfo.ipAddress}
                    </code>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge
                      variant={serverInfo.isRunning ? "default" : "secondary"}
                      className={
                        serverInfo.isRunning
                          ? "bg-success text-success-foreground"
                          : ""
                      }
                    >
                      {serverInfo.isRunning ? "Running" : "Not running"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="text-sm text-muted-foreground">
                      {uptimeStr}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {connectionState === "connected" && serverInfo.isRunning && (
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
                  disabled={!serverInfo.isRunning}
                >
                  <Power className="h-4 w-4 mr-2" />
                  {!serverInfo.isRunning
                    ? "Shutting Down..."
                    : "Shutdown Server"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default FrontendApp;
