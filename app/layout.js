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
  metadataBase: new URL("https://sanhodo.vn"),
  title: "San Hô Đỏ Hồ Tràm | Hải sản cao cấp, đặt bàn nhanh, combo tiết kiệm",
  description:
    "Nhà hàng San Hô Đỏ Hồ Tràm với không gian sang trọng, hải sản cao cấp, combo 2 người - 4 người - tiệc và form đặt bàn nhanh kết nối CRM, Zalo, Google Sheet.",
  openGraph: {
    title: "San Hô Đỏ Hồ Tràm | Hải sản cao cấp, đặt bàn nhanh, combo tiết kiệm",
    description:
      "Không gian ẩm thực chỉn chu, món signature nổi bật, combo tối ưu theo số người và hệ thống đặt bàn nhanh cho nhà hàng San Hô Đỏ Hồ Tràm.",
    url: "https://sanhodo.vn",
    siteName: "San Hô Đỏ Hồ Tràm",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "/assets/drive-hero-exterior.jpg",
        width: 1600,
        height: 900,
        alt: "Không gian nhà hàng San Hô Đỏ Hồ Tràm"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "San Hô Đỏ Hồ Tràm | Đặt bàn nhanh, combo tối ưu",
    description:
      "Đặt bàn nhanh, gọi ngay, nhận ưu đãi và chọn món trước cho nhà hàng San Hô Đỏ Hồ Tràm.",
    images: ["/assets/drive-hero-exterior.jpg"]
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
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
