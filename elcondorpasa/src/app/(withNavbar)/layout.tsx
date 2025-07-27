import Navbar from "@/components/Navbar";
import { TokenProvider } from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <TokenProvider>
          <div className="pb-20">
            <Navbar />
          </div>
          {/* Main content area */}
          <main className="">{children}</main>
        </TokenProvider>
      </body>
    </html>
  );
}
