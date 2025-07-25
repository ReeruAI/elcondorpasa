import PreferenceModel from "@/db/models/PreferenceModel";
import { NextResponse } from "next/server";

// POST: Create a new preference
export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-userId");
    if (!userId) {
      throw new Error("User ID is missing from headers");
    }
    const body = await req.json();

    // Check if preference already exists
    const existingPreference = await PreferenceModel.collection().then(
      (collection) => collection.findOne({ userId })
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
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}

// PUT: Update a preference by userId
export async function PUT(req: Request) {
  try {
    const userId = req.headers.get("x-userId");
    if (!userId) {
      throw new Error("User ID is missing from headers");
    }
    const body = await req.json();
    const modifiedCount = await PreferenceModel.updatePreference(userId, body);
    return NextResponse.json({ success: true, modifiedCount });
  } catch (error) {
    console.error("Error updating preference:", error);
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}
