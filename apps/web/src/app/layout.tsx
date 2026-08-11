import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Convergence Radar",
  description: "Transparent smart-money convergence signals."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
