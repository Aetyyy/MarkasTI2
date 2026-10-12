import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import AnnouncementRibbon from "@/components/announcements/announcementRibbon";

export const metadata: Metadata = {
  title: "Markas TI 2",
  description:
    "Markas TI 2 adalah pusat informasi santai untuk jadwal, struktur kelas, dan informasi perkuliahan Teknik Informatika.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <AnnouncementRibbon />
      {children}
      <Footer />
    </>
  );
}
