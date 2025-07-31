import PreferenceModel from "@/db/models/PreferenceModel";
import { NextResponse } from "next/server";

// GET: Get preference by userId
export async function GET(req: Request) {
  try {
    const userId = req.headers.get("x-userId");
    if (!userId) {
      throw new Error("User ID is missing from headers");
    }

    const preference = await PreferenceModel.getPreferenceByUserId(userId);

    if (!preference) {
      return NextResponse.json({
        success: true,
        hasPreference: false,
        preference: null,
      });
    }

    return NextResponse.json({
      success: true,
      hasPreference: true,
      preference,
    });
  } catch (error) {
    console.error("Error getting preference:", error);
    const err =
      error instanceof Error
        ? error
        : { message: "Unknown error", status: 400 };
    return NextResponse.json(
      { success: false, error: err.message },
      {
        status:
          typeof err === "object" &&
          "status" in err &&
          typeof (err as { status?: unknown }).status === "number"
            ? (err as { status: number }).status
            : 400,
      }
    );
  }
}

// POST: Create a new preference
export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-userId");
    if (!userId) {
      throw new Error("User ID is missing from headers");
    }
    const body = await req.json();

    // Check if preference already exists
    const existingPreference = await PreferenceModel.getPreferenceByUserId(
      userId
    );

    if (existingPreference) {
      return NextResponse.json(
        { success: false, error: "Preference for this user already exists" },
        { status: 400 }
      );
    }

    // Validate and insert preference
    const insertedId = await PreferenceModel.createPreference({
      ...body,
      userId,
    });

    return NextResponse.json({ success: true, insertedId });
  } catch (error) {
    console.error("Error creating preference:", error);
    const err =
      error instanceof Error
        ? error
        : { message: "Unknown error", status: 400 };
    return NextResponse.json(
      { success: false, error: err.message },
      {
        status:
          typeof err === "object" &&
          "status" in err &&
          typeof (err as { status?: unknown }).status === "number"
            ? (err as { status: number }).status
            : 400,
      }
    );
  }
}

// PUT: Update or create preference by userId (upsert)
export async function PUT(req: Request) {
  try {
    const userId = req.headers.get("x-userId");
    if (!userId) {
      throw new Error("User ID is missing from headers");
    }
    const body = await req.json();

    // Check if preference exists
    const existingPreference = await PreferenceModel.getPreferenceByUserId(
      userId
    );

    if (existingPreference) {
      // Update existing preference
      const modifiedCount = await PreferenceModel.updatePreference(
        userId,
        body
      );
      return NextResponse.json({
        success: true,
        modifiedCount,
        action: "updated",
      });
    } else {
      // Create new preference if it doesn't exist
      const insertedId = await PreferenceModel.createPreference({
        ...body,
        userId,
      });
      return NextResponse.json({
        success: true,
        insertedId,
        action: "created",
      });
    }
  } catch (error) {
    console.error("Error updating/creating preference:", error);
    const err =
      error instanceof Error
        ? error
        : { message: "Unknown error", status: 400 };
    return NextResponse.json(
      { success: false, error: err.message },
      {
        status:
          typeof err === "object" &&
          "status" in err &&
          typeof (err as { status?: unknown }).status === "number"
            ? (err as { status: number }).status
            : 400,
      }
    );
  }
}

// DELETE: Delete preference by userId
export async function DELETE(req: Request) {
  try {
    const userId = req.headers.get("x-userId");
    if (!userId) {
      throw new Error("User ID is missing from headers");
    }

    const deletedCount = await PreferenceModel.deletePreference(userId);

    if (deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Preference not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error("Error deleting preference:", error);
    const err =
      error instanceof Error
        ? error
        : { message: "Unknown error", status: 400 };
    return NextResponse.json(
      { success: false, error: err.message },
      {
        status:
          typeof err === "object" &&
          "status" in err &&
          typeof (err as { status?: unknown }).status === "number"
            ? (err as { status: number }).status
            : 400,
      }
    );
  }
}
