import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Complain Dashboard",
  description: "Complain Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased bg-white text-black selection:bg-blue-600 selection:text-white`}
      >
        {children}
        <Toaster
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#334155',
              borderRadius: '2px', // rounded-xs
              border: '1px solid #e2e8f0', // border-slate-200
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#059669', // emerald-600
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#dc2626', // red-600
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
