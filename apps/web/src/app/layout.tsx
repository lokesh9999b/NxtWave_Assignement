import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Team Task Tracker",
  description: "Task board for the SDE II assignment"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
