// app/api/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    console.log("Received webhook request");
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    // console.log("Parsed Body:", body);

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key: sentSignature,
      transaction_status,
    } = body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const expectedSignature = crypto
      .createHash("sha512")
      .update(order_id + status_code + gross_amount + serverKey)
      .digest("hex");

    // console.log("Expected Signature:", expectedSignature);
    // console.log("Sent Signature:", sentSignature);

    if (expectedSignature !== sentSignature) {
      console.warn("❌ Signature mismatch");
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 403 }
      );
    }

    //  Signature valid — proceed with status handling
    if (transaction_status === "settlement") {
      console.log(` Order ${order_id} is settled`);
      // Update DB: mark order as paid
    } else if (["cancel", "expire"].includes(transaction_status)) {
      console.log(` Order ${order_id} failed: ${transaction_status}`);
      // Update DB: mark order as failed/expired
    } else {
      console.log(`Order ${order_id} has status: ${transaction_status}`);
    }

    return NextResponse.json({ message: "Webhook received" });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
