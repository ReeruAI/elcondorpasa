import CronService from "@/lib/cronService";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cronService = CronService.getInstance();

    // Test daily reminder
    await cronService.testDailyReminder();

    return NextResponse.json({
      success: true,
      message: "Daily reminder test executed successfully",
    });
  } catch (error: any) {
    console.error("Cron test error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json();
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
