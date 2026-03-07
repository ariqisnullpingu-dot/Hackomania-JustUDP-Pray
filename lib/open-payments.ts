import {
  createAuthenticatedClient,
  type AuthenticatedClient,
  isPendingGrant,
} from "@interledger/open-payments";

let clientInstance: AuthenticatedClient | null = null;

export async function getOpenPaymentsClient(): Promise<AuthenticatedClient> {
  if (clientInstance) return clientInstance;

  const walletAddressUrl = process.env.WALLET_ADDRESS_URL;
  const privateKey = process.env.PRIVATE_KEY;
  const keyId = process.env.KEY_ID;

  if (!walletAddressUrl || !privateKey || !keyId) {
    throw new Error(
      "Missing Open Payments configuration. Set WALLET_ADDRESS_URL, PRIVATE_KEY, and KEY_ID."
    );
  }

  // Handle potential base64 encoding or raw PEM
  const formattedPrivateKey = privateKey.includes("-----BEGIN")
    ? privateKey
    : Buffer.from(privateKey, "base64");

  clientInstance = await createAuthenticatedClient({
    walletAddressUrl,
    privateKey: formattedPrivateKey,
    keyId,
  });

  return clientInstance;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  amount?: string;
  currency?: string;
  error?: string;
}

export async function sendPayment(
  recipientWalletUrl: string,
  amountValue: string,
  assetCode: string = "USD",
  assetScale: number = 2
): Promise<PaymentResult> {
  try {
    const client = await getOpenPaymentsClient();

    const senderWalletUrl = process.env.OP_WALLET_ADDRESS!;
    const senderWallet = await client.walletAddress.get({
      url: senderWalletUrl,
    });
    const recipientWallet = await client.walletAddress.get({
      url: recipientWalletUrl,
    });

    const incomingGrant = await client.grant.request(
      { url: recipientWallet.authServer },
      {
        access_token: {
          access: [
            {
              type: "incoming-payment",
              actions: ["create", "read", "list"],
            },
          ],
        },
      }
    );

    if (isPendingGrant(incomingGrant)) {
      return { success: false, error: "Incoming payment grant requires interaction." };
    }

    const incomingPayment = await client.incomingPayment.create(
      {
        url: recipientWallet.resourceServer,
        accessToken: incomingGrant.access_token!.value,
      },
      {
        walletAddress: recipientWalletUrl,
        incomingAmount: {
          value: amountValue,
          assetCode,
          assetScale,
        },
      }
    );

    const quoteGrant = await client.grant.request(
      { url: senderWallet.authServer },
      {
        access_token: {
          access: [
            {
              type: "quote",
              actions: ["create", "read"],
            },
          ],
        },
      }
    );

    if (isPendingGrant(quoteGrant)) {
      return { success: false, error: "Quote grant requires interaction." };
    }

    const quote = await client.quote.create(
      {
        url: senderWallet.resourceServer,
        accessToken: quoteGrant.access_token!.value,
      },
      {
        walletAddress: senderWalletUrl,
        receiver: incomingPayment.id,
        method: "ilp",
      }
    );

    const outgoingGrant = await client.grant.request(
      { url: senderWallet.authServer },
      {
        access_token: {
          access: [
            {
              identifier: senderWalletUrl,
              type: "outgoing-payment",
              actions: ["create", "read"],
              limits: {
                debitAmount: {
                  value: quote.debitAmount.value,
                  assetCode: quote.debitAmount.assetCode,
                  assetScale: quote.debitAmount.assetScale,
                },
              },
            },
          ],
        },
      }
    );

    if (isPendingGrant(outgoingGrant)) {
      return {
        success: false,
        error: "Outgoing payment grant requires user interaction.",
      };
    }

    const outgoingPayment = await client.outgoingPayment.create(
      {
        url: senderWallet.resourceServer,
        accessToken: outgoingGrant.access_token!.value,
      },
      {
        walletAddress: senderWalletUrl,
        quoteId: quote.id,
      }
    );

    return {
      success: true,
      transactionId: outgoingPayment.id,
      amount: `${(parseInt(amountValue) / Math.pow(10, assetScale)).toFixed(assetScale)} ${assetCode}`,
      currency: assetCode,
    };
  } catch (error: any) {
    console.error("Open Payments error:", error);
    return {
      success: false,
      error: error.message || "Payment failed",
    };
  }
}
