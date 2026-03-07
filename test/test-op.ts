// import { getOpenPaymentsClient } from "../lib/open-payments";

// async function testConnection() {
//     console.log("Testing Open Payments connection...");
//     try {
//         const client = await getOpenPaymentsClient();
//         console.log("✅ Client connected successfully!");

//         const walletAddressUrl = process.env.WALLET_ADDRESS_URL!;
//         const walletAddress = await client.walletAddress.get({
//             url: walletAddressUrl,
//         });

//         console.log("✅ Wallet Address retrieved:", walletAddress.id);
//         console.log("Connection test passed.");
//     } catch (error: any) {
//         console.error("❌ Connection failed:");
//         console.error(error.message);
//         if (error.message.includes("Missing Open Payments configuration")) {
//             console.log("\nTIP: Make sure you've added WALLET_ADDRESS_URL, PRIVATE_KEY, and KEY_ID to your .env.local file.");
//         }
//     }
// }

// testConnection();
