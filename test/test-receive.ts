import "dotenv/config";
import { createAuthenticatedClient } from "@interledger/open-payments";
import fs from "fs";
// Load configuration from environment variables
const WALLET_ADDRESS = process.env.WALLET_ADDRESS_URL!;
const privateKey = fs.readFileSync("wallet.pem", "utf8");
const KEY_ID = process.env.KEY_ID!;

// The incoming payment access token you already obtained
const INCOMING_PAYMENT_ACCESS_TOKEN = "7B769D3DCEEB1B586169";

async function testCreateIncomingPayment() {
  // Initialize Open Payments client
  const client = await createAuthenticatedClient({
    walletAddressUrl: WALLET_ADDRESS,
    privateKey: privateKey,
    keyId: KEY_ID,
  });

  // Get wallet info
  const walletAddress = await client.walletAddress.get({
    url: WALLET_ADDRESS,
  });

  // Create incoming payment
  const incomingPayment = await client.incomingPayment.create(
    {
      url: walletAddress.resourceServer,
      accessToken: INCOMING_PAYMENT_ACCESS_TOKEN,
    },
    {
      walletAddress: WALLET_ADDRESS,
      incomingAmount: {
        value: "1000", // 1000 minor units = $10 if assetScale = 2
        assetCode: walletAddress.assetCode,
        assetScale: walletAddress.assetScale,
      },
      expiresAt: new Date(Date.now() + 60_000 * 10).toISOString(), // 10 minutes expiry
    }
  );

  console.log("✅ Incoming Payment Created!");
  console.log("Incoming Payment URL:", incomingPayment.id);
}

testCreateIncomingPayment().catch((err) => {
  console.error("Error creating incoming payment:", err);
});