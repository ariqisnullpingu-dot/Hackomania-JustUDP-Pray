import { NextRequest, NextResponse } from "next/server";
import { initiatePayment } from "@/lib/open-payments";

interface DisburseRequest {
  committee: string;
  amount: number;
  disasterType: string;
  confidence: number;
  latitude: number;
  longitude: number;
  redirectUri?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: DisburseRequest = await req.json();
    const { committee, amount, disasterType, confidence, latitude, longitude, redirectUri } = body;

    if (!committee || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid disbursement request" }, { status: 400 });
    }

    const recipientWalletUrl = process.env.CLIENT_WALLET_ADDRESS_URL;
    if (!recipientWalletUrl) {
      return NextResponse.json({ error: "CLIENT_WALLET_ADDRESS_URL is not configured" }, { status: 500 });
    }

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const callbackUri = redirectUri || `${appUrl}/payment/callback`;

    // Central wallet initiates the payment to the client wallet.
    // Uses the same interactive grant flow as a regular donation —
    // the admin approves the disbursement in the central wallet UI.
    const result = await initiatePayment(
      recipientWalletUrl,
      amount,
      callbackUri,
      "central"   // ← sender is the central wallet
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      ...result,
      committee,
      recipientWallet: recipientWalletUrl,
      disasterType,
      confidence,
      location: { latitude, longitude },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Disbursement error:", error);
    return NextResponse.json({ error: error.message || "Disbursement failed" }, { status: 500 });
  }
}
