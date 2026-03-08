import fs from "fs";
import {
  createAuthenticatedClient,
  type AuthenticatedClient,
  isPendingGrant,
  isFinalizedGrant,
} from "@interledger/open-payments";
import { randomUUID } from "crypto";

const clients: Record<string, AuthenticatedClient> = {};

function getPrivateKey(filename: string): string {
  try {
    return fs.readFileSync(filename, "utf8");
  } catch {
    throw new Error(
      `Could not read ${filename}.`
    );
  }
}

export async function getOpenPaymentsClient(type: "client" | "central" = "client"): Promise<AuthenticatedClient> {
  if (clients[type]) return clients[type];

  const isClient = type === "client";
  const walletAddressUrl = isClient
    ? process.env.CLIENT_WALLET_ADDRESS_URL
    : process.env.CENTRAL_WALLET_ADDRESS_URL;
  const keyId = isClient
    ? process.env.CLIENT_KEY_ID
    : process.env.CENTRAL_KEY_ID;
  const keyFilename = isClient ? "wallet.pem" : "central.pem";

  if (!walletAddressUrl || !keyId) {
    throw new Error(
      `Missing Open Payments config for ${type}. Set ${isClient ? "CLIENT" : "CENTRAL"}_WALLET_ADDRESS_URL and KEY_ID.`
    );
  }

  clients[type] = await createAuthenticatedClient({
    walletAddressUrl,
    privateKey: getPrivateKey(keyFilename),
    keyId,
  });

  return clients[type];
}


export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  amount?: string;
  currency?: string;
  error?: string;
}

export interface InitiatePaymentResult {
  success: boolean;
  approvalUrl?: string;
  continueToken?: string;
  continueUri?: string;
  quoteId?: string;
  senderWalletUrl?: string;
  isRecurring?: boolean;
  error?: string;
}



export async function initiateRecurringPayment(
  recipientWalletUrl: string,
  amountDollars: number,
  repetitions: number = 12,
  period: string = "P1M",
  redirectUri: string = "http://localhost:3000"
): Promise<InitiatePaymentResult> {
  try {
    const client = await getOpenPaymentsClient("client");
    const centralClient = await getOpenPaymentsClient("central");

    const senderWalletUrl = process.env.CLIENT_WALLET_ADDRESS_URL!;

    const [senderWallet, recipientWallet] = await Promise.all([
      client.walletAddress.get({ url: senderWalletUrl }),
      centralClient.walletAddress.get({ url: recipientWalletUrl }),
    ]);

    const incomingGrant = await centralClient.grant.request(
      { url: recipientWallet.authServer },
      {
        access_token: {
          access: [{ type: "incoming-payment", actions: ["create", "read", "complete"] }],
        },
      }
    );
    if (isPendingGrant(incomingGrant)) {
      return { success: false, error: "Incoming payment grant unexpectedly requires interaction." };
    }


    const receiveValue = String(
      Math.round(amountDollars * Math.pow(10, recipientWallet.assetScale))
    );
    const incomingPayment = await centralClient.incomingPayment.create(
      {
        url: recipientWallet.resourceServer,
        accessToken: incomingGrant.access_token!.value,
      },
      {
        walletAddress: recipientWalletUrl,
        incomingAmount: {
          value: receiveValue,
          assetCode: recipientWallet.assetCode,
          assetScale: recipientWallet.assetScale,
        },
        expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
      }
    );

    const quoteGrant = await client.grant.request(
      { url: senderWallet.authServer },
      {
        access_token: {
          access: [{ type: "quote", actions: ["create", "read"] }],
        },
      }
    );
    if (isPendingGrant(quoteGrant)) {
      return { success: false, error: "Quote grant unexpectedly requires interaction." };
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

    // for my reference R3/2025-10-03T23:25:00Z/P1M
    const startISO = new Date().toISOString();
    const interval = `R${repetitions}/${startISO}/${period}`;


    const nonce = randomUUID();
    const outgoingGrant = await client.grant.request(
      { url: senderWallet.authServer },
      {
        access_token: {
          access: [
            {
              identifier: senderWallet.id,
              type: "outgoing-payment",
              actions: ["create", "read", "list"],
              limits: {
                debitAmount: {
                  value: quote.debitAmount.value,
                  assetCode: quote.debitAmount.assetCode,
                  assetScale: quote.debitAmount.assetScale,
                },
                interval,
              },
            },
          ],
        },
        interact: {
          start: ["redirect"],
          finish: {
            method: "redirect",
            uri: redirectUri,
            nonce,
          },
        },
      }
    );
    // console.log(outgoingGrant);

    if (!isPendingGrant(outgoingGrant)) {
      if (isFinalizedGrant(outgoingGrant)) {
        if (!outgoingGrant.access_token) throw new Error("No access token on finalized grant.");
        const outgoingPayment = await client.outgoingPayment.create(
          { url: senderWallet.resourceServer, accessToken: outgoingGrant.access_token.value },
          { walletAddress: senderWalletUrl, quoteId: quote.id }
        );
        return { success: true, continueToken: outgoingPayment.id, quoteId: quote.id, senderWalletUrl, isRecurring: true };
      }
      return { success: false, error: "Unexpected grant state." };
    }

    return {
      success: true,
      approvalUrl: outgoingGrant.interact.redirect,
      continueToken: outgoingGrant.continue.access_token.value,
      continueUri: outgoingGrant.continue.uri,
      quoteId: quote.id,
      senderWalletUrl,
      isRecurring: true,
    };
  } catch (error: any) {
    console.error("initiateRecurringPayment error:", error);
    return { success: false, error: error.message || "Failed to initiate recurring payment." };
  }
}


export async function initiatePayment(
  recipientWalletUrl: string,
  amountDollars: number,
  redirectUri: string = "http://localhost:3000"
): Promise<InitiatePaymentResult> {
  try {
    const client = await getOpenPaymentsClient("client");
    const centralClient = await getOpenPaymentsClient("central");

    const senderWalletUrl = process.env.CLIENT_WALLET_ADDRESS_URL!;

    const [senderWallet, recipientWallet] = await Promise.all([
      client.walletAddress.get({ url: senderWalletUrl }),
      centralClient.walletAddress.get({ url: recipientWalletUrl }),
    ]);

    const debitAmount = {
      value: String(Math.round(amountDollars * Math.pow(10, senderWallet.assetScale))),
      assetCode: senderWallet.assetCode,
      assetScale: senderWallet.assetScale,
    };

    const incomingGrant = await centralClient.grant.request(
      { url: recipientWallet.authServer },
      {
        access_token: {
          access: [
            {
              type: "incoming-payment",
              actions: ["create", "read", "complete"],
            },
          ],
        },
      }
    );

    if (isPendingGrant(incomingGrant)) {
      return { success: false, error: "Incoming payment grant unexpectedly requires interaction." };
    }

    const incomingPayment = await centralClient.incomingPayment.create(
      {
        url: recipientWallet.resourceServer,
        accessToken: incomingGrant.access_token!.value,
      },
      {
        walletAddress: recipientWalletUrl,
        expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
      }
    );

    const quoteGrant = await client.grant.request(
      { url: senderWallet.authServer },
      {
        access_token: {
          access: [{ type: "quote", actions: ["create", "read"] }],
        },
      }
    );


    if (isPendingGrant(quoteGrant)) {
      return { success: false, error: "Quote grant unexpectedly requires interaction." };
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
        debitAmount,
      }
    );

    const nonce = randomUUID();
    const outgoingGrant = await client.grant.request(
      { url: senderWallet.authServer },
      {
        access_token: {
          access: [
            {
              identifier: senderWallet.id,
              type: "outgoing-payment",
              actions: ["create", "read", "list"],
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
        interact: {
          start: ["redirect"],
          finish: {
            method: "redirect",
            uri: redirectUri,
            nonce,
          },
        },
      }
    );

    if (!isPendingGrant(outgoingGrant)) {

      if (isFinalizedGrant(outgoingGrant)) {
        if (!outgoingGrant.access_token) throw new Error("No access token on finalized grant.");
        const outgoingPayment = await client.outgoingPayment.create(
          {
            url: senderWallet.resourceServer,
            accessToken: outgoingGrant.access_token.value,
          },
          { walletAddress: senderWalletUrl, quoteId: quote.id }
        );
        return {
          success: true,
          continueToken: outgoingPayment.id,
          quoteId: quote.id,
          senderWalletUrl,
        };
      }
      return { success: false, error: "Unexpected grant state." };
    }

    return {
      success: true,
      approvalUrl: outgoingGrant.interact.redirect,
      continueToken: outgoingGrant.continue.access_token.value,
      continueUri: outgoingGrant.continue.uri,
      quoteId: quote.id,
      senderWalletUrl,
    };
  } catch (error: any) {
    console.error("initiatePayment error:", error);
    return { success: false, error: error.message || "Failed to initiate payment." };
  }
}


export async function finalizePayment(
  continueToken: string,
  continueUri: string,
  interactRef: string,
  senderWalletUrl: string,
  quoteId: string
): Promise<PaymentResult> {
  try {
    const client = await getOpenPaymentsClient();
    const grant = await client.grant.continue(
      { accessToken: continueToken, url: continueUri },
      { interact_ref: interactRef }
    );

    if (!isFinalizedGrant(grant)) {
      return { success: false, error: "Grant was not approved by the user." };
    }


    const senderWallet = await client.walletAddress.get({ url: senderWalletUrl });


    if (!grant.access_token) throw new Error("No access token on finalized grant.");
    const outgoingPayment = await client.outgoingPayment.create(
      {
        url: senderWallet.resourceServer,
        accessToken: grant.access_token.value,
      },
      { walletAddress: senderWalletUrl, quoteId }
    );

    const sent = outgoingPayment.sentAmount;
    const displayAmount = sent
      ? `${(parseInt(sent.value) / Math.pow(10, sent.assetScale)).toFixed(sent.assetScale)} ${sent.assetCode}`
      : undefined;

    return {
      success: true,
      transactionId: outgoingPayment.id,
      amount: displayAmount,
      currency: sent?.assetCode,
    };
  } catch (error: any) {
    console.error("finalizePayment error:", error);
    return { success: false, error: error.message || "Failed to finalize payment." };
  }
}
