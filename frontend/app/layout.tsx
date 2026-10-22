 import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";

export const metadata: Metadata = {
  title: "PEOPLE — Verifiable Event Attendance",
  description: "Issue and collect non-transferable proof-of-attendance credentials on Bohr.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-background font-sans antialiased">
        <Providers>
          <AppHeader />
          {children}
          <AppFooter />
        </Providers>
      </body>
    </html>
  );
}
