import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import I18nProvider from "@/components/I18nProvider";
import { getMessages } from "next-intl/server";

export const metadata: Metadata = {
  title: "yukgo.live — Discover Every Event in Indonesia",
  description: "Indonesia's event discovery platform. Find concerts, workshops, conferences, meetups, and more — all in one place.",
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="antialiased bg-white text-gray-900 min-h-screen flex flex-col">
        <I18nProvider locale={locale} messages={messages}>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
