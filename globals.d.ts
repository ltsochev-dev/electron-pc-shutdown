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
      openExternal: (url: string) => void;
      systemShutdown: () => Promise<string>;
    };
  }

  declare const WEB_VITE_DEV_SERVER_URL: string;
}
