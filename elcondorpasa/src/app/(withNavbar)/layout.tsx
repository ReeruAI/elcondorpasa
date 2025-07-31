import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { TokenProvider } from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TokenProvider>
      <div className="pb-20">
        <Navbar />
      </div>
      {/* Main content area */}
      <main>{children}</main>
      {/* Footer */}
      <Footer />
    </TokenProvider>
  );
}
