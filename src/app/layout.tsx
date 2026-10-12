import type { Metadata } from "next";
import { Suspense } from "react";
import { Be_Vietnam_Pro } from "next/font/google";
import { AssistantHost } from "@/components/assistant/assistant-host";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TASCO Renewal Journey — BeyondPilot Demo",
  description:
    "AI-assisted TNDS renewal journey for the GenAI Fund BeyondPilot × Tasco challenge",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${beVietnam.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {children}
        <Suspense fallback={null}>
          <AssistantHost />
        </Suspense>
      </body>
    </html>
  );
}