import "./globals.css";

export const metadata = {
  title: "LiS Keuzetool",
  description: "Keuzetool LiS voor Werkenden",
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
