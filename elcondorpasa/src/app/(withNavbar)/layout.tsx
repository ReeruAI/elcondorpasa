import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="pb-20">
          <Navbar />
        </div>
        {/* Main content area */}
        <main className="">{children}</main>
      </body>
    </html>
  );
}
