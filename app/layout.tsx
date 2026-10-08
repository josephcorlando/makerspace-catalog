import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Makerspace · Tool Directory",
    template: "%s · Makerspace",
  },
  description:
    "Find makerspace tools, materials, processes, and related accessories.",
  icons: { icon: "/makerspace/icon.svg" },
  openGraph: {
    images: [
      {
        url: "https://makerspace.josephorlando.dev/hive.png",
        alt: "HiveLabs makerspace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://makerspace.josephorlando.dev/hive.png"],
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
