import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AuthToastHost } from "@/components/auth/AuthToastHost";

import "./styles/globals.css";

export const metadata: Metadata = {
  title: "Employee Management System | Arellano University",
  description: "Arellano University employee and integration management prototype.",
  icons: {
    icon: "/images/new-au-logo.png",
    shortcut: "/images/new-au-logo.png",
    apple: "/images/new-au-logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthToastHost />
        {children}
      </body>
    </html>
  );
}
