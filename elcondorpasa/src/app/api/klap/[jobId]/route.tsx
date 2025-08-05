// src/app/api/klap/status/[jobId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import JobModel from "@/db/models/JobModel";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const job = await JobModel.getJob(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      jobId: job.jobId,
      status: job.status,
      progress: job.progress || 0,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    });
  } catch (error) {
    console.error("Error getting job status:", error);
    return NextResponse.json(
      { error: "Failed to get job status" },
      { status: 500 }
    );
  }
}
