import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();

const ctx = router.options.context as { queryClient: import("@tanstack/react-query").QueryClient };

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={ctx.queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
