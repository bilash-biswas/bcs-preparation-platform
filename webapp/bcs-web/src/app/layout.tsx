// app/layout.tsx
import type { Metadata } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Suspense } from "react";
import QueryProvider from "@/components/providers/query-provider";
import { Toaster } from "react-hot-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ReduxProvider from "@/components/providers/redux-provider";
import { HydrationFix } from "@/components/hydration-fix";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const bengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-bengali",
});

export const metadata: Metadata = {
  title: "BCS Preparation - বাংলাদেশ সিভিল সার্ভিস প্রস্তুতি",
  description: "বিসিএস পরীক্ষার জন্য সম্পূর্ণ প্রস্তুতিমূলক প্ল্যাটফর্ম",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className={`${inter.variable} ${bengali.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('reader-theme') || 'light';
                  var fontSize = localStorage.getItem('reader-font-size') || 'default';
                  document.documentElement.setAttribute('data-theme', theme);
                  document.documentElement.setAttribute('data-font-size', fontSize);
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body className="font-sans" suppressHydrationWarning={true}>
        <HydrationFix />
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-600">লোড হচ্ছে...</p>
              </div>
            </div>
          }
        >
          <ReduxProvider>
            <QueryProvider>
              <ThemeProvider>
                <AuthProvider>
                  <Header />
                  <main className="min-h-screen">
                    {children}
                  </main>
                  <Footer />
                </AuthProvider>
              </ThemeProvider>
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#363636",
                    color: "#fff",
                  },
                  success: {
                    duration: 3000,
                  },
                  error: {
                    duration: 5000,
                  },
                }}
              />
            </QueryProvider>
          </ReduxProvider>
        </Suspense>
      </body>
    </html>
  );
}