import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CaptureOS",
  description: "Your team CRM — leads, deals, contacts, and meetings in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Animated background orbs — glass blurs these */}
        <div className="bg-scene" aria-hidden>
          <div className="bg-orb-3" />
          <div className="bg-orb-4" />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
