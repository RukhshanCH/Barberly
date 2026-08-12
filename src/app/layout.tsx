import type { Metadata } from "next";
import "@/styles/globals.css";
import { Navbar } from "@/components/Navbar/Navbar";
import { Footer } from "@/components/Footer/Footer";

export const metadata: Metadata = {
  title: "Barberly — find and book a barber near you",
  description: "Search local barber shops and book your next appointment in a couple of taps.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="l-page">
          <Navbar />
          <main className="l-page__main">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
