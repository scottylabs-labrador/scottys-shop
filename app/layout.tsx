import type { Metadata } from "next";
import localFont from "next/font/local";
import { Caladea, Rubik } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/nav/Header";
import Banner from "@/components/nav/Banner";
import SyncUserWithFirebase from "@/components/SyncUserWithFirebase";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const rubik = Rubik({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-rubik",
  weight: ["400", "500", "700"],
});

const caladea = Caladea({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-caladea",
});

export const metadata: Metadata = {
  title: "Scotty's Shop",
  description: "By ScottyLabs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${rubik.variable} ${caladea.variable} antialiased relative`}
      >
        <ClerkProvider>
          <SyncUserWithFirebase />
          <main className="min-h-[calc(100vh-4rem)] pt-[125px] relative z-0">
            <div className="fixed top-0 w-full z-[100]">
              <Banner />
              <Header />
            </div>
            <div className="max-w-8xl mx-auto px-3">{children}</div>
          </main>
        </ClerkProvider>
      </body>
    </html>
  );
}
