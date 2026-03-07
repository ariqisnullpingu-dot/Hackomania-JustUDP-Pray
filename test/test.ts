// import "dotenv/config";
// import fs from "fs";
// import { createAuthenticatedClient, isPendingGrant } from "@interledger/open-payments";

// async function testPaymentFlow(amount: string = "100") {
//   // Read wallet info and private key
//   const walletAddressUrl = process.env.WALLET_ADDRESS_URL!;
//   const keyId = process.env.KEY_ID!;
//   const privateKey = process.env.PRIVATE_KEY?.includes("BEGIN")
//     ? process.env.PRIVATE_KEY
//     : fs.readFileSync("wallet.pem", "utf8");

//   const client = await createAuthenticatedClient({
//     walletAddressUrl,
//     privateKey,
//     keyId,
//   });

//   // Step 1: Get wallet info
//   const walletAddress = await client.walletAddress.get({ url: walletAddressUrl });
//   console.log("Sender Wallet ID:", walletAddress.id);

//   // Step 2: Create incoming payment (recipient wallet)
//   const incomingPayment = await client.incomingPayment.create(
//     {
//       url: walletAddress.resourceServer,
//       accessToken: await getIncomingPaymentAccessToken(client, walletAddress),
//     },
//     {
//       walletAddress: walletAddressUrl,
//       incomingAmount: {
//         value: amount,
//         assetCode: walletAddress.assetCode,
//         assetScale: walletAddress.assetScale,
//       },
//     }
//   );
//   console.log("Incoming Payment ID:", incomingPayment.id);

//   // Step 3: Create a quote (sender wallet)
//   const quote = await client.quote.create(
//     {
//       url: walletAddress.resourceServer,
//       accessToken: await getQuoteAccessToken(client, walletAddress),
//     },
//     {
//       walletAddress: walletAddressUrl,
//       receiver: incomingPayment.id,
//       method: "ilp",
//     }
//   );
//   console.log("Quote ID:", quote.id);

//   // Step 4: Request interactive outgoing grant
//   const outgoingGrant = await client.grant.request(
//     { url: walletAddress.authServer },
//     {
//       access_token: {
//         access: [
//           {
//             identifier: walletAddress.id,
//             type: "outgoing-payment",
//             actions: ["create", "read", "list"],
//             limits: {
//               debitAmount: {
//                 value: quote.debitAmount.value,
//                 assetCode: quote.debitAmount.assetCode,
//                 assetScale: quote.debitAmount.assetScale,
//               },
//             },
//           },
//         ],
//       },
//       interact: {
//         start: ["redirect"],
//         finish: {
//           method: "redirect",
//           uri: "http://localhost:3000", // change to your local redirect handler
//           nonce: "12345", // random nonce
//         },
//       },
//     }
//   );

//   if (!isPendingGrant(outgoingGrant)) {
//     throw new Error("Expected interactive grant");
//   }

//   console.log("Open the following URL in a browser to approve the grant:");
//   console.log(outgoingGrant.interact.redirect);
//   console.log("Continue Access Token after approval:", outgoingGrant.continue.access_token.value);

//   // Step 5: Create outgoing payment (after approval)
//   // After the grant is approved, use the continue.access_token to create outgoing payment
// }

// async function getIncomingPaymentAccessToken(client: any, walletAddress: any) {
//   const grant = await client.grant.request(
//     { url: walletAddress.authServer },
//     {
//       access_token: {
//         access: [
//           { type: "incoming-payment", actions: ["create", "read", "list", "complete"] },
//         ],
//       },
//     }
//   );
//   if (isPendingGrant(grant)) throw new Error("Incoming grant requires interaction");
//   return grant.access_token!.value;
// }

// async function getQuoteAccessToken(client: any, walletAddress: any) {
//   const grant = await client.grant.request(
//     { url: walletAddress.authServer },
//     {
//       access_token: {
//         access: [{ type: "quote", actions: ["create", "read", "read-all"] }],
//       },
//     }
//   );
//   if (isPendingGrant(grant)) throw new Error("Quote grant requires interaction");
//   return grant.access_token!.value;
// }

// async function main() {
//   await testPaymentFlow("100"); // send 100 units (depends on asset scale)
// }

// main().catch(console.error);