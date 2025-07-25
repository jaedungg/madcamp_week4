import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "프롬(From) - AI 글쓰기 도우미",
  description: "마음을 전하는 AI 글쓰기 도우미 프롬. 편지, 이메일, 메시지를 감정과 목적에 맞게 자연스럽게 작성하세요.",
  keywords: ["AI 글쓰기", "글쓰기 도우미", "이메일 작성", "편지 쓰기", "AI 텍스트 생성", "프롬"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
