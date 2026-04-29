import { Cormorant_Garamond, Great_Vibes, Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800"]
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  variable: "--font-cormorant",
  weight: ["500", "600", "700"]
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-great-vibes",
  weight: "400"
});

export const metadata = {
  title: "San Ho Do Ho Tram",
  description: "Landing page cho nhà hàng San Hô Đỏ Hồ Tràm"
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="vi"
      className={`${montserrat.variable} ${cormorant.variable} ${greatVibes.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
