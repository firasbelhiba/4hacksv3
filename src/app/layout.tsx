import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { SITE_CONFIG } from "@/lib/constants";
import { Providers } from "@/components/providers";
import { AuthLoading } from "@/components/ui/auth-loading";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: SITE_CONFIG.title,
  description: SITE_CONFIG.description,
  keywords: ["hackathon", "AI", "tournament", "competition", "coding"],
  authors: [{ name: "4hacks Team" }],
  creator: "4hacks",
  metadataBase: new URL(SITE_CONFIG.url),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_CONFIG.url,
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    creator: "@4hacks",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "hsl(var(--card))",
                color: "hsl(var(--card-foreground))",
                border: "1px solid hsl(var(--border))",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
