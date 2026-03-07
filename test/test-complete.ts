// import "dotenv/config";
// import fs from "fs";
// import { createAuthenticatedClient, isPendingGrant } from "@interledger/open-payments";

// async function runFullPaymentFlow(amount: string = "100", continueToken?: string) {
//   const walletAddressUrl = process.env.WALLET_ADDRESS_URL!;
//   const keyId = process.env.KEY_ID!;
//   const privateKey = process.env.PRIVATE_KEY?.includes("BEGIN")
//     ? process.env.PRIVATE_KEY
//     : fs.readFileSync("wallet.pem", "utf8");

//   const client = await createAuthenticatedClient({ walletAddressUrl, privateKey, keyId });

//   // 1️⃣ Get wallet info
//   const walletAddress = await client.walletAddress.get({ url: walletAddressUrl });
//   console.log("Sender Wallet ID:", walletAddress.id);

//   // 2️⃣ Create incoming payment
//   const incomingGrant = await client.grant.request(
//     { url: walletAddress.authServer },
//     { access_token: { access: [{ type: "incoming-payment", actions: ["create", "read", "list", "complete"] }] } }
//   );
//   if (isPendingGrant(incomingGrant)) throw new Error("Incoming grant requires interaction");
//   const incomingPayment = await client.incomingPayment.create(
//     { url: walletAddress.resourceServer, accessToken: incomingGrant.access_token!.value },
//     {
//       walletAddress: walletAddressUrl,
//       incomingAmount: {
//         value: amount,
//         assetCode: walletAddress.assetCode,
//         assetScale: walletAddress.assetScale,
//       },
//       expiresAt: new Date(Date.now() + 60_000 * 10).toISOString(),
//     }
//   );
//   console.log("Incoming Payment ID:", incomingPayment.id);

//   // 3️⃣ Create quote
//   const quoteGrant = await client.grant.request(
//     { url: walletAddress.authServer },
//     { access_token: { access: [{ type: "quote", actions: ["create", "read"] }] } }
//   );
//   if (isPendingGrant(quoteGrant)) throw new Error("Quote grant requires interaction");
//   const quote = await client.quote.create(
//     { url: walletAddress.resourceServer, accessToken: quoteGrant.access_token!.value },
//     { walletAddress: walletAddressUrl, receiver: incomingPayment.id, method: "ilp" }
//   );
//   console.log("Quote ID:", quote.id);

//   // 4️⃣ Request outgoing grant (interactive)
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
//         finish: { method: "redirect", uri: "http://localhost:3000", nonce: "12345" },
//       },
//     }
//   );

//   if (!isPendingGrant(outgoingGrant)) throw new Error("Expected interactive grant");

//   console.log("\n🔗 Open this URL in a browser to approve the outgoing grant:");
//   console.log(outgoingGrant.interact.redirect);
//   console.log("\n📝 After approval, enter the Continue Access Token below to finalize payment.");

//   if (!continueToken) return console.log("Waiting for Continue Access Token...");

//   // 5️⃣ Finalize outgoing payment
//   const outgoingPayment = await client.outgoingPayment.create(
//     { url: walletAddress.resourceServer, accessToken: continueToken },
//     { walletAddress: walletAddressUrl, quoteId: quote.id }
//   );
//   console.log("\n✅ Outgoing Payment completed:", outgoingPayment.id);

//   // 6️⃣ Complete incoming payment (optional)
//   await client.incomingPayment.complete({
//     url: incomingPayment.id,
//     accessToken: incomingGrant.access_token!.value,
//   });
//   console.log("✅ Incoming Payment marked complete");
// }

// // Example usage: runFullPaymentFlow("100")
// // If you have the Continue Access Token after approval, pass it as second argument:
// // runFullPaymentFlow("100", "AAB2ED41AA810E89318F");

// runFullPaymentFlow("100").catch(console.error);