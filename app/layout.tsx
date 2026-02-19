import type { Metadata } from "next";
import "./globals.css";
import { OpenClawProvider } from "@/contexts/OpenClawContext";
import { Sidebar } from "@/components/Sidebar";
import { FloatingMicButton } from "@/components/FloatingMicButton";

export const metadata: Metadata = {
  title: "OpenClaw Dashboard",
  description: "Visual dashboard for the OpenClaw AI gateway",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <OpenClawProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
          <FloatingMicButton />
        </OpenClawProvider>
      </body>
    </html>
  );
}
