import { NextRequest, NextResponse } from "next/server";
import { initiateRecurringPayment } from "@/lib/open-payments";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            recipientWalletUrl,
            amountDollars,
            months = 12,
            periodMonths = 1,
        } = body;

        if (!recipientWalletUrl || !amountDollars || Number(amountDollars) <= 0) {
            return NextResponse.json(
                { error: "recipientWalletUrl and amountDollars are required." },
                { status: 400 }
            );
        }

        const appUrl = process.env.APP_URL || "http://localhost:3000";
        const redirectUri = `${appUrl}/payment/callback`;

       
        const period = `P${periodMonths}M`;

        const result = await initiateRecurringPayment(
            recipientWalletUrl,
            Number(amountDollars),
            Number(months),
            period,
            redirectUri
        );

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[/api/payment/subscribe]", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
