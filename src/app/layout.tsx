import type { Metadata } from "next";
import { Suspense } from "react";
import { Be_Vietnam_Pro, Outfit, VT323 } from "next/font/google";
import { AssistantHost } from "@/components/assistant/assistant-host";
import { getLocale } from "@/lib/i18n/locale";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "TASCO Renewal Journey — BeyondPilot Demo",
  description:
    "AI-assisted TNDS renewal journey for the GenAI Fund BeyondPilot × Tasco challenge",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${beVietnam.variable} ${outfit.variable} ${vt323.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        {children}
        <Suspense fallback={null}>
          <AssistantHost />
        </Suspense>
      </body>
    </html>
  );
}
