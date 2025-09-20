import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Server,
  Play,
  Square,
  Wifi,
  Activity,
  Copy,
  CheckCircle2,
  AlertCircle,
  LoaderPinwheel,
  Power,
} from "lucide-react";
import {
  TooltipTrigger,
  Tooltip,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useFormatTimeSince } from "@/hooks/useFormatTimeSince";
import QRCode from "react-qr-code";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

function App() {
  const [serverIP, setServerIP] = useState<string>(null);
  const [serverPort, setServerPort] = useState<number>(null);
  const [serverStartedAt, setServerStartedAt] = useState(0);
  const uptimeStr = useFormatTimeSince(serverStartedAt);
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [serverLoading, setServerLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState([
    {
      id: 1,
      timestamp: "14:32:15",
      type: "info",
      message: "Server initialized successfully",
    },
    {
      id: 2,
      timestamp: "14:32:16",
      type: "info",
      message: "Listening on 192.168.1.100:3000",
    },
    {
      id: 3,
      timestamp: "14:35:22",
      type: "success",
      message: "Client connected from 192.168.1.105",
    },
    {
      id: 4,
      timestamp: "14:36:01",
      type: "info",
      message: "Processing client request",
    },
  ]);

  const serverAddress = useMemo(() => {
    if (!serverIP || !serverPort) return null;

    return `${serverIP}:${serverPort}`;
  }, [serverIP, serverPort]);

  const isFetchingServerInfo = serverAddress === null;

  useEffect(() => {
    if (!window.electron) return;

    window.electron.notifyReactReady();
  }, []);

  useEffect(() => {
    fetchServerInfo();
  }, []);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(serverAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Text copied to clipboard! You can now paste it anywhere.");
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const fetchServerInfo = async () => {
    const info = await window.electron.serverInfo();
    if (info) {
      setServerIP(info.ipAddress);
      setServerPort(info.port);
      setIsServerRunning(info.isRunning);
      setServerStartedAt(info.startedAt);
    }
    return info;
  };

  const handleShutdown = () => {
    window.electron.exit(0);
  };

  const handleServerToggle = async () => {
    if (isFetchingServerInfo) return;
    if (serverLoading) return;

    try {
      setServerLoading(true);

      const res = isServerRunning
        ? await window.electron.serverStop()
        : await window.electron.serverStart();

      if (!res) {
        alert("Something went wrong starting the server");
        return;
      }

      await fetchServerInfo();
    } catch (e) {
      console.error(e);
    } finally {
      setServerLoading(false);
    }
  };

  const handleOpenMobileWeb = () => {
    window.electron.openExternal(`http://${serverAddress}`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Server className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Desktop Server Control
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your local server instance
              </p>
            </div>
          </div>
          <div className="tashak ml-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className=" p-2 rounded-full"
                  onClick={handleShutdown}
                >
                  <Power className="size-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Shut down the server</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Server Status Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Server Status
              </CardTitle>
              <CardDescription>Current server information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge
                    variant={isServerRunning ? "default" : "secondary"}
                    className={
                      isServerRunning
                        ? "bg-success text-success-foreground"
                        : ""
                    }
                  >
                    {isServerRunning ? "Running" : "Stopped"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium">Server Address</span>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    {isFetchingServerInfo ? (
                      <div className="flex w-full items-center justify-center text-gray-500">
                        <LoaderPinwheel className="animate-spin" />
                      </div>
                    ) : (
                      <>
                        <code className="text-sm font-mono flex-1">
                          <Button
                            type="button"
                            variant="link"
                            onClick={handleOpenMobileWeb}
                          >
                            {serverAddress}
                          </Button>
                        </code>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={copyAddress}
                              className="h-6 w-6 p-0"
                            >
                              {copied ? (
                                <CheckCircle2 className="h-3 w-3 text-success" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy address</TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uptime</span>
                  <span className="text-sm text-muted-foreground">
                    {isServerRunning ? uptimeStr : "0m"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Connections</span>
                  <span className="text-sm text-muted-foreground">
                    {isServerRunning ? "1 active" : "0 active"}
                  </span>
                </div>
              </div>

              <Separator />

              <Button
                className="w-full"
                variant={isServerRunning ? "destructive" : "outline"}
                onClick={handleServerToggle}
                disabled={serverLoading}
                hidden={isFetchingServerInfo}
              >
                {isServerRunning ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Stop Server
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Server
                  </>
                )}
              </Button>
              {!isFetchingServerInfo && isServerRunning && (
                <div className="flex items-center justify-center pt-4">
                  <QRCode
                    title="Scan QR code to open web interface"
                    value={`http://${serverAddress}`}
                    className="size-28"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logs Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Server Logs
              </CardTitle>
              <CardDescription>
                Real-time server activity and connection messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full">
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      {getLogIcon(log.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">
                            {log.timestamp}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {log.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground">{log.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

(async () => {
  const root = createRoot(document.body);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
})();
