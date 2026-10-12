import type { Metadata } from "next";
import "./[locale]/globals.css";

export const metadata: Metadata = {
  title: "yukgo.live — Discover Every Event in Indonesia",
  description: "Indonesia's event discovery platform. Find concerts, workshops, conferences, meetups, and more — all in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
