import "dotenv/config";
import fs from "fs";
import {
  createAuthenticatedClient,
  isPendingGrant,
} from "@interledger/open-payments";

async function testRequestPayment(amount: string = "100") {
  const walletAddressUrl = process.env.WALLET_ADDRESS_URL!;
  const privateKey = fs.readFileSync("wallet.pem", "utf8");
  const keyId = process.env.KEY_ID!;
  console.log("Wallet URL:", walletAddressUrl);
  console.log("KEY_ID:", keyId);
  console.log("Private Key starts with:", privateKey.slice(0, 30));
  const client = await createAuthenticatedClient({
    walletAddressUrl,
    privateKey,
    keyId,
  });

  // Discover wallet info
  const walletAddress = await client.walletAddress.get({
    url: walletAddressUrl,
  });

  // Request grant
  const grant = await client.grant.request(
    { url: walletAddress.authServer },
    {
      access_token: {
        access: [
          {
            type: "incoming-payment",
            actions: ["create", "read", "list", "complete"],
          },
        ],
      },
    },
  );

  if (isPendingGrant(grant)) {
    throw new Error("Grant requires user interaction.");
  }

  // Create incoming payment
  const incomingPayment = await client.incomingPayment.create(
    {
      url: walletAddress.resourceServer,
      accessToken: grant.access_token!.value,
    },
    {
      walletAddress: walletAddressUrl,
      incomingAmount: {
        value: amount,
        assetCode: walletAddress.assetCode,
        assetScale: walletAddress.assetScale,
      },
    },
  );

  console.log("Payment request created!");
  console.log("Incoming Payment ID:", incomingPayment.id);

  return incomingPayment;
}

async function main() {
  const payment = await testRequestPayment("100");

  console.log("Payment URL:", payment.id);
}

main();
