import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserContextInner, UserProvider } from "@/contexts/UserContext";
import { CartProvider } from "@/contexts/CartContext";
import Header from "@/components/header/Header";
import { FavoriteProvider } from "@/contexts/FavoriteContext";
import Head from "next/head";
// import GuestInit from "@/components/GuessInit";
import { Toaster } from "react-hot-toast";
import CheckoutHost from "@/components/orders/CheckoutHost";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZileDigital | Haitian Art Marketplace",
  description:
    "Discover unique Haitian-inspired digital and print artworks. Explore veve symbols, cultural icons, and tropical visuals. Customize frames, formats, and support local artists.",
  keywords: [
    "Haitian art",
    "digital art",
    "printable wall art",
    "veve symbols",
    "Haitian culture",
    "Afro-Caribbean art",
    "art marketplace",
    "buy digital downloads",
    "custom art prints",
    "ZileDigital",
  ],
  authors: [{ name: "ZileDigital" }],
  openGraph: {
    title: "ZileDigital | Haitian Art Marketplace",
    description:
      "A curated digital gallery inspired by Haiti. Browse digital downloads and custom prints with framing options. Bring culture to your walls.",
    url: process.env.NEXTAUTH_URL, // replace with your actual domain
    siteName: "ZileDigital",
    images: [
      {
        url: `${process.env.NEXTAUTH_URL}/images/why-haitian-art.png`, // Replace with actual Open Graph image
        width: 1200,
        height: 630,
        alt: "ZileDigital - Haitian Art Marketplace",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZileDigital | Haitian Art Marketplace",
    description:
      "Shop digital and print Haitian art. Unique pieces. Instant downloads. Frame-ready prints.",
    images: [`${process.env.NEXTAUTH_URL}/images/why-haitian-art.png`], // Replace with actual image
    creator: "@ziledigital", // Replace with your Twitter handle if you have one
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || ""), // replace with actual domain
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Sacramento&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          <UserContextInner>
            <CartProvider>
              <FavoriteProvider>
                <div className="bg-[#0f0f1a] bg-dot-grid bg-[length:var(--tw-background-size-dot-grid)] min-h-screen bg-gradient-to-r from-amber-100 via-white to-slate-100 text-gray-900">
                  <Header />
                  <Toaster position="top-right" />

                  {/* <GuestInit/> */}

                  <main className="px-4 md:px-10 lg:px-20">{children}</main>
                  <CheckoutHost />

                  <footer className="text-center text-sm py-6">
                    &copy; 2024 ZileDigital Market
                  </footer>
                </div>
              </FavoriteProvider>
            </CartProvider>
          </UserContextInner>
        </UserProvider>
      </body>
    </html>
  );
}
