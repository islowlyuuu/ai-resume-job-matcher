import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Boss 投递助手",
  description: "根据 Boss 岗位描述优化简历和开场白。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
