import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Only initialize CronService in runtime, not during build
    if (
      process.env.NEXT_RUNTIME !== "nodejs" ||
      process.env.NODE_ENV === "test"
    ) {
      return NextResponse.json({
        success: false,
        message: "CronService not available during build or test",
      });
    }

    // Dynamic import to prevent build-time initialization
    const { default: CronService } = await import("@/lib/cronService");
    const cronService = CronService.getInstance();

    // Test daily reminder
    await cronService.testDailyReminder();

    return NextResponse.json({
      success: true,
      message: "Daily reminder test executed successfully",
    });
  } catch (error: unknown) {
    console.error("Cron test error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Only initialize CronService in runtime, not during build
    if (
      process.env.NEXT_RUNTIME !== "nodejs" ||
      process.env.NODE_ENV === "test"
    ) {
      return NextResponse.json({
        success: false,
        message: "CronService not available during build or test",
      });
    }

    const { action } = await request.json();

    // Dynamic import to prevent build-time initialization
    const { default: CronService } = await import("@/lib/cronService");
    const cronService = CronService.getInstance();

    switch (action) {
      case "test_daily":
        await cronService.testDailyReminder();
        return NextResponse.json({
          success: true,
          message: "Daily reminder sent",
        });

      case "list_jobs":
        cronService.listJobs();
        return NextResponse.json({
          success: true,
          message: "Check console for job list",
        });

      case "stop_all":
        cronService.stopAllJobs();
        return NextResponse.json({
          success: true,
          message: "All jobs stopped",
        });

      case "start_all":
        cronService.startAllJobs();
        return NextResponse.json({
          success: true,
          message: "All jobs started",
        });

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
