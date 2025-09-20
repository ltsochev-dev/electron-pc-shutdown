export {};

export type ServerInfo = {
  ipAddress: string;
  port: number;
  connections: number;
  isRunning: boolean;
  startedAt: number;
};

declare global {
  interface Window {
    electron: {
      serverStart: () => Promise<boolean>;
      serverStop: () => Promise<boolean>;
      serverInfo: () => Promise<ServerInfo>;
      notifyReactReady: () => void;
      exit: (code: number) => void;
    };
  }
}
