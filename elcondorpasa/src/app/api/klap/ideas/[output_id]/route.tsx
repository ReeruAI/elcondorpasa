import { NextRequest, NextResponse } from "next/server";

const KLAP_API_KEY = process.env.KLAP_API_KEY as string;

export async function GET(
  request: NextRequest,
  { params }: { params: { output_id: string } }
) {
  try {
    const { output_id } = params;

    if (!output_id) {
      return NextResponse.json({ error: "Missing output_id" }, { status: 400 });
    }

    if (!KLAP_API_KEY) {
      return NextResponse.json(
        { error: "Missing KLAP_API_KEY" },
        { status: 500 }
      );
    }

    // Get shorts ideas with virality scores
    const ideasRes = await fetch(
      `https://api.klap.app/v2/projects/${output_id}`,
      {
        headers: {
          Authorization: `Bearer ${KLAP_API_KEY}`,
        },
      }
    );

    // Check if response is JSON
    const contentType = ideasRes.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const textResponse = await ideasRes.text();
      console.error("Non-JSON ideas response:", textResponse);
      return NextResponse.json(
        { error: "Ideas API returned non-JSON response" },
        { status: 500 }
      );
    }

    const ideasData = await ideasRes.json();

    if (!ideasRes.ok) {
      console.error("Ideas fetch failed:", ideasData);
      return NextResponse.json(
        { error: ideasData.message || "Failed to fetch shorts ideas" },
        { status: ideasRes.status }
      );
    }

    // Return the shorts with their ideas, virality scores, etc.
    return NextResponse.json({
      status: "success",
      project_id: output_id,
      shorts: ideasData.shorts || [],
      project_details: {
        id: ideasData.id,
        name: ideasData.name,
        created_at: ideasData.created_at,
        status: ideasData.status,
      },
    });
  } catch (error) {
    console.error("Ideas fetch error:", error);

    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json(
        { error: "API returned invalid JSON response" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
