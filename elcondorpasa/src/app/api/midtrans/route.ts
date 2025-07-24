import axios from "axios";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id, amount, customer } = body;

    // Validate required fields
    if (!order_id || !amount || !customer) {
      return Response.json(
        { message: "Missing required fields: order_id, amount, or customer" },
        { status: 400 }
      );
    }

    const midtransResponse = await axios.post(
      "https://app.sandbox.midtrans.com/snap/v1/transactions",
      {
        transaction_details: {
          order_id: order_id,
          gross_amount: amount,
        },
        credit_card: {
          secure: true,
        },
        customer_details: {
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
        },
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
      message: "Midtrans Snap Token created",
      data: midtransResponse.data,
    });
  } catch (error) {
    if (error instanceof Error) {
      // AxiosError type guard
      const axiosError = error as any;
      console.error(
        "Midtrans Error:",
        axiosError.response?.data || error.message
      );

      return Response.json(
        {
          message: "Failed to create transaction",
          error: axiosError.response?.data || error.message,
        },
        { status: 500 }
      );
    } else {
      console.error("Midtrans Error:", error);

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
