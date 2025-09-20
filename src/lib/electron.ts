import { exec } from "child_process";

export function systemShutdown(): Promise<string> {
  console.log("shuttin down the system");
  return new Promise((resolve) => resolve("kekw"));
  return new Promise((resolve, reject) => {
    let cmd: string;
    switch (process.platform) {
      case "win32":
        cmd = "shutdown /s /f /t 0";
        break;
      case "darwin":
        cmd = "osascript -e 'tell app \"System Events\" to shut down'";
        break;
      case "linux":
        cmd = "shutdown -h now";
        break;
      default:
        return reject(new Error("Unsupported platform"));
    }

    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout || stderr);
    });
  });
}
