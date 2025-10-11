import "./globals.css";
import Providers from "../components/providers/Providers";

// Use system fonts instead of Google Fonts to avoid build-time network issues
const geistSans = {
  variable: "--font-geist-sans",
  className: "font-sans",
};

const geistMono = {
  variable: "--font-geist-mono", 
  className: "font-mono",
};

export const metadata = {
  title: "Eventrra",
  description: "Eventrra Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
