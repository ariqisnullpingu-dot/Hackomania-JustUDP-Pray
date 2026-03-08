import { NextRequest, NextResponse } from "next/server";
import { finalizePayment } from "@/lib/open-payments";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { continueToken, continueUri, interactRef, senderWalletUrl, quoteId, senderType } = body;

        if (!continueToken || !continueUri || !interactRef || !senderWalletUrl || !quoteId) {
            return NextResponse.json(
                { error: "Missing required fields: continueToken, continueUri, interactRef, senderWalletUrl, quoteId" },
                { status: 400 }
            );
        }

        const result = await finalizePayment(
            continueToken,
            continueUri,
            interactRef,
            senderWalletUrl,
            quoteId,
            senderType ?? "client"   // "central" for disbursements, "client" for donations
        );

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[/api/payment/finalize]", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

