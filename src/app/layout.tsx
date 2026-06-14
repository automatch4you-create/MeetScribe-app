import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "MeetScribe — תמלול הקלטות בעברית",
  description: "תתרכזו בפגישה, אנחנו נדאג לסיכום. תמלול אוטומטי של הקלטות בעברית עם זיהוי דוברים.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Footer />
      </body>
    </html>
  );
}
