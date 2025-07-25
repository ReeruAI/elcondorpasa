import { database } from "@/db/config/mongodb";
import { MidtransModel } from "@/db/models/MidtransModel";
import axios from "axios";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { package_id } = body;

    // Get user ID from headers
    const userId = req.headers.get("x-userId");
    // console.log("User ID from headers:", req.headers);

    // Validate required fields
    if (!package_id) {
      return Response.json(
        { message: "Missing required field: package_id" },
        { status: 400 }
      );
    }

    if (!userId) {
      return Response.json(
        { message: "Missing user authentication" },
        { status: 401 }
      );
    }

    // Connect to database
    const midtransModel = new MidtransModel(database);

    // Get user details
    const user = await midtransModel.getUserById(userId);
    if (!user) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    // Get package details
    const packageData = await midtransModel.getPackageById(package_id);
    if (!packageData) {
      return Response.json({ message: "Package not found" }, { status: 404 });
    }

    // Create transaction in database with pending status
    const now = new Date();
    const transactionId = await midtransModel.createTransaction({
      packageId: new ObjectId(package_id),
      userId: new ObjectId(userId),
      status: "pending",
      amount: packageData.price,
      created_at: now,
      updated_at: now,
    });

    // Use transaction ID as order_id for Midtrans
    const order_id = transactionId.toString();

    // Update transaction with order_id
    await database
      .collection("transactions")
      .updateOne({ _id: transactionId }, { $set: { order_id: order_id } });

    // Prepare customer details from user data
    const customer = {
      first_name: user.name.split(" ")[0] || user.name,
      last_name: user.name.split(" ").slice(1).join(" ") || "",
      email: user.email,
      phone: user.phone,
    };

    // Create Midtrans transaction
    const midtransResponse = await axios.post(
      "https://app.sandbox.midtrans.com/snap/v1/transactions",
      {
        transaction_details: {
          order_id: order_id,
          gross_amount: packageData.price,
        },
        credit_card: {
          secure: true,
        },
        customer_details: customer,
        item_details: [
          {
            id: package_id,
            price: packageData.price,
            quantity: 1,
            name: `${packageData.name} Package - ${packageData.reeruToken} Reeru Tokens`,
          },
        ],
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            process.env.MIDTRANS_SERVER_KEY + ":"
          ).toString("base64")}`,
        },
      }
    );

    return Response.json({
      message: "Midtrans Snap Token created successfully",
      data: {
        token: midtransResponse.data.token,
        redirect_url: midtransResponse.data.redirect_url,
        order_id: order_id,
        transaction_id: transactionId.toString(),
        package: {
          name: packageData.name,
          price: packageData.price,
          reeruToken: packageData.reeruToken,
        },
      },
    });
  } catch (error) {
    console.error("Midtrans Error:", error);

    if (error instanceof Error) {
      const axiosError = error as any;
      return Response.json(
        {
          message: "Failed to create transaction",
          error: axiosError.response?.data || error.message,
        },
        { status: 500 }
      );
    } else {
      return Response.json(
        {
          message: "Failed to create transaction",
          error: String(error),
        },
        { status: 500 }
      );
    }
  }
}
