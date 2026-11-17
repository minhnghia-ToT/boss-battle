
import "./globals.css";

export const metadata = {
  title: "Boss Battle - Thắng Ngu",
  description: "A pixel art boss battle adventure",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
