import { Suspense } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import HomeContent from "@/components/HomeContent";

// Mock function to simulate server-side data fetching
async function getHomeData() {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    heroTitle: "Welcome to Our Amazing Platform",
    heroSubtitle: "Build something incredible with Next.js 15",
    features: [
      {
        id: 1,
        title: "Lightning Fast",
        description: "Built with performance in mind",
      },
      {
        id: 2,
        title: "SEO Optimized",
        description: "Server-side rendering for better SEO",
      },
      {
        id: 3,
        title: "Modern Stack",
        description: "Using the latest Next.js and Tailwind CSS",
      },
    ],
    stats: {
      users: "10K+",
      projects: "500+",
      satisfaction: "99%",
    },
  };
}

export default async function Home() {
  // Server-side data fetching
  const data = await getHomeData();

  return (
    <>
      <LoadingScreen />
      <Suspense fallback={<div className="min-h-screen" />}>
        <div>
          {/* Section 1 */}
          <section
            style={{
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "3rem",
              fontWeight: "bold",
              backgroundColor: "#1D1D1D",
            }}
          >
            SECTION 1
          </section>

          {/* Section 2 */}
          <section
            style={{
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "3rem",
              fontWeight: "bold",
              backgroundColor: "#1D1D1D",
            }}
          >
            SECTION 2
          </section>

          {/* Section 3 */}
          <section
            style={{
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "3rem",
              fontWeight: "bold",
              backgroundColor: "#1D1D1D",
            }}
          >
            SECTION 3
          </section>
        </div>
      </Suspense>
    </>
  );
}
