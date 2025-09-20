import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

function FrontendApp() {
  return <h1 className="text-center text-lg">Hello from web react</h1>;
}

const rootEl = document.body;
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(
    <StrictMode>
      <FrontendApp />
    </StrictMode>
  );
}
