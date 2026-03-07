import { NextRequest, NextResponse } from "next/server";
import { sendPayment, type PaymentResult } from "@/lib/open-payments";

const COMMITTEE_WALLETS: Record<string, string> = {
  "International Disaster Relief Fund": "https://ilp.interledger-test.dev/disaster-relief",
  "Japan Red Cross Society": "https://ilp.interledger-test.dev/jp-relief",
  "American Red Cross": "https://ilp.interledger-test.dev/us-relief",
  "Philippine Red Cross": "https://ilp.interledger-test.dev/ph-relief",
  "Bangladesh Red Crescent Society": "https://ilp.interledger-test.dev/bd-relief",
  "Mexican Red Cross": "https://ilp.interledger-test.dev/mx-relief",
  "Indonesian Red Cross": "https://ilp.interledger-test.dev/id-relief",
  "Indian Red Cross Society": "https://ilp.interledger-test.dev/in-relief",
  "Thai Red Cross Society": "https://ilp.interledger-test.dev/th-relief",
  "Kenya Red Cross Society": "https://ilp.interledger-test.dev/ke-relief",
  "Italian Red Cross": "https://ilp.interledger-test.dev/it-relief",
};

interface DisburseRequest {
  committee: string;
  amount: number;
  disasterType: string;
  confidence: number;
  latitude: number;
  longitude: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: DisburseRequest = await req.json();
    const { committee, amount, disasterType, confidence, latitude, longitude } = body;

    if (!committee || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid disbursement request" },
        { status: 400 }
      );
    }

    const walletUrl =
      COMMITTEE_WALLETS[committee] || COMMITTEE_WALLETS["International Disaster Relief Fund"];

    const amountInCents = String(Math.round(amount * 100));

    let result: PaymentResult;

    const hasOpenPaymentsConfig =
      process.env.OP_WALLET_ADDRESS &&
      process.env.OP_PRIVATE_KEY &&
      process.env.OP_KEY_ID;

    if (hasOpenPaymentsConfig) {
      result = await sendPayment(walletUrl, amountInCents, "USD", 2);
    } else {
      await new Promise((r) => setTimeout(r, 1500));
      result = {
        success: true,
        transactionId: `demo-txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        amount: `$${amount.toFixed(2)} USD`,
        currency: "USD",
      };
    }

    return NextResponse.json({
      ...result,
      committee,
      recipientWallet: walletUrl,
      disasterType,
      confidence,
      location: { latitude, longitude },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Disbursement error:", error);
    return NextResponse.json(
      { error: error.message || "Disbursement failed" },
      { status: 500 }
    );
  }
}
