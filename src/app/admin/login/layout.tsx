import type { ReactNode } from "react";

export default function LoginLayout({ children }: { children: ReactNode }) {
  // This layout is separate from the main admin layout to avoid auth redirect
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
