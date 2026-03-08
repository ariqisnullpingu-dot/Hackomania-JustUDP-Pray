import { NextRequest, NextResponse } from "next/server";
import { initiatePayment } from "@/lib/open-payments";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { recipientWalletUrl, amountDollars } = body;

        if (!recipientWalletUrl || !amountDollars || Number(amountDollars) <= 0) {
            return NextResponse.json(
                { error: "recipientWalletUrl and amountDollars are required." },
                { status: 400 }
            );
        }

        // The callback URL must be the app's public URL so the wallet knows where
        // to redirect after the user approves. In production, set APP_URL env var.
        const appUrl = process.env.APP_URL || "http://localhost:3000";
        const redirectUri = `${appUrl}/payment/callback`;

        const result = await initiatePayment(
            recipientWalletUrl,
            Number(amountDollars),
            redirectUri
        );

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[/api/payment/initiate]", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
