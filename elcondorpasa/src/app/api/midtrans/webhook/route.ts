import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { database } from "@/db/config/mongodb";
import { MidtransModel } from "@/db/models/MidtransModel";

export async function POST(req: NextRequest) {
  try {
    console.log("📨 Received webhook request");

    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    console.log("📋 Webhook payload:", {
      order_id: body.order_id,
      transaction_status: body.transaction_status,
      status_code: body.status_code,
    });

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key: sentSignature,
      transaction_status,
    } = body;

    // Validate required fields
    if (!order_id || !status_code || !gross_amount || !sentSignature) {
      console.warn("❌ Missing required webhook fields");
      return NextResponse.json(
        { message: "Missing required webhook fields" },
        { status: 400 }
      );
    }

    // Verify signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const expectedSignature = crypto
      .createHash("sha512")
      .update(order_id + status_code + gross_amount + serverKey)
      .digest("hex");

    if (expectedSignature !== sentSignature) {
      console.warn("❌ Signature mismatch for order:", order_id);
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 403 }
      );
    }

    console.log("✅ Signature verified for order:", order_id);

    // Connect to database
    const midtransModel = new MidtransModel(database);

    // Get transaction details
    const transactionDetails = await midtransModel.getTransactionDetails(
      order_id
    );

    if (!transactionDetails) {
      console.warn("⚠️ Transaction not found:", order_id);
      return NextResponse.json(
        { message: "Transaction not found" },
        { status: 404 }
      );
    }

    // Check current transaction status
    const currentStatus = transactionDetails.status;
    console.log(`📊 Current transaction status: ${currentStatus}`);

    // Define final states that cannot be changed
    const finalStates = ["paid", "failed", "expired"];

    // Check if current status is in final state
    if (finalStates.includes(currentStatus)) {
      console.warn(
        `🔒 Transaction ${order_id} is already in final state: ${currentStatus}. Cannot update.`
      );
      return NextResponse.json({
        message: `Transaction is already in final state: ${currentStatus}`,
        order_id: order_id,
        current_status: currentStatus,
        attempted_status: transaction_status,
      });
    }

    // Only allow changes if current status is "pending"
    if (currentStatus !== "pending") {
      console.warn(
        `🚫 Transaction ${order_id} status is ${currentStatus}, not pending. Cannot update.`
      );
      return NextResponse.json({
        message: `Can only update transactions with pending status. Current status: ${currentStatus}`,
        order_id: order_id,
        current_status: currentStatus,
      });
    }

    console.log(
      `✅ Transaction ${order_id} is in pending state, proceeding with update`
    );

    // Handle different transaction statuses
    let newStatus: "pending" | "paid" | "failed" | "expired" = "pending";
    let shouldUpdateTokens = false;

    switch (transaction_status) {
      case "capture":
      case "settlement":
        newStatus = "paid";
        shouldUpdateTokens = true;
        console.log(`💰 Order ${order_id} is settled/captured`);
        break;

      case "pending":
        newStatus = "pending";
        console.log(`⏳ Order ${order_id} is pending`);
        break;

      case "deny":
      case "cancel":
      case "failure":
        newStatus = "failed";
        console.log(`❌ Order ${order_id} failed: ${transaction_status}`);
        break;

      case "expire":
        newStatus = "expired";
        console.log(`⏰ Order ${order_id} expired`);
        break;

      default:
        console.log(`ℹ️ Order ${order_id} has status: ${transaction_status}`);
        break;
    }

    // Additional check: Don't update if the new status is the same as current status
    if (newStatus === currentStatus) {
      console.log(
        `📋 Status unchanged for order ${order_id}: ${currentStatus}`
      );
      return NextResponse.json({
        message: "Status unchanged",
        order_id: order_id,
        status: currentStatus,
      });
    }

    // Update transaction status
    const statusUpdated = await midtransModel.updateTransactionStatus(
      order_id,
      newStatus
    );

    if (!statusUpdated) {
      console.warn("⚠️ Failed to update transaction status");
      return NextResponse.json(
        { message: "Failed to update transaction status" },
        { status: 500 }
      );
    }

    console.log(
      `📝 Transaction ${order_id} status updated from ${currentStatus} to ${newStatus}`
    );

    // If payment is successful, update user tokens
    if (
      shouldUpdateTokens &&
      transactionDetails.user &&
      transactionDetails.package
    ) {
      const tokensAdded = await midtransModel.updateUserTokens(
        transactionDetails.user._id,
        transactionDetails.package.reeruToken
      );

      if (tokensAdded) {
        console.log(
          `🎉 Added ${transactionDetails.package.reeruToken} tokens to user ${transactionDetails.user.username}`
        );
      } else {
        console.warn("⚠️ Failed to update user tokens");
      }
    }

    // Log the successful processing
    console.log(
      `✅ Webhook processed successfully for order: ${order_id}, status updated from ${currentStatus} to ${newStatus}`
    );

    return NextResponse.json({
      message: "Webhook processed successfully",
      order_id: order_id,
      previous_status: currentStatus,
      new_status: newStatus,
    });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return NextResponse.json(
      {
        message: "Server error processing webhook",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
