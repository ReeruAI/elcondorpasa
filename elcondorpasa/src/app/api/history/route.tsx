// app/api/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import HistoryModel from "@/db/models/HistoryModel";

export async function GET(request: NextRequest) {
  try {
    // Get userId from headers
    const userId = request.headers.get("x-userId");

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "User ID not found",
        },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    const contentPreference = searchParams.get("contentPreference");
    const languagePreference = searchParams.get("languagePreference");

    // Fetch history based on filters
    let history;
    if (contentPreference || languagePreference) {
      history = await HistoryModel.getHistoryByPreference(
        userId,
        contentPreference || undefined,
        languagePreference || undefined
      );
      // Apply pagination manually for filtered results
      history = history.slice(skip, skip + limit);
    } else {
      history = await HistoryModel.getHistoryByUserId(userId, limit, skip);
    }

    // Get total count for pagination
    const totalCount = await HistoryModel.countUserHistory(userId);

    return NextResponse.json({
      success: true,
      data: history,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch history",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear history
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get("x-userId");

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "User ID not found",
        },
        { status: 401 }
      );
    }

    // Delete specific history item if ID provided
    const { searchParams } = new URL(request.url);
    const historyId = searchParams.get("id");

    if (historyId) {
      const deletedCount = await HistoryModel.deleteHistoryById(
        historyId,
        userId
      );
      return NextResponse.json({
        success: true,
        message: "History item deleted",
        deletedCount,
      });
    }

    // Otherwise clear all history for user
    const deletedCount = await HistoryModel.deleteAllUserHistory(userId);

    return NextResponse.json({
      success: true,
      message: "All history cleared",
      deletedCount,
    });
  } catch (error: any) {
    console.error("History delete error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete history",
        message: error.message || "Unknown error",
      },
      { status: error.status || 500 }
    );
  }
}
