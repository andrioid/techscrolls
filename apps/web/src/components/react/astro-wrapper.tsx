import { StrictMode, Suspense, type ReactNode } from "react";

export function AstroWrapper({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p>loading</p>}>
      <StrictMode>{children}</StrictMode>
    </Suspense>
  );
}
