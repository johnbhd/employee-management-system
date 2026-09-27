import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./styles/globals.css";

export const metadata: Metadata = {
  title: "Employee Management System | Arellano University",
  description: "Arellano University employee and integration management prototype.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
