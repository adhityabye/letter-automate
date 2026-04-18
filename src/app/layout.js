import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Letter Automate",
  description: "Local-First Document Generator",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface-50 text-surface-900">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
