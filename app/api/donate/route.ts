import { createAuthenticatedClient } from '@interledger/open-payments'
import path from 'path'

export async function GET() {
  try {
    const WALLET_ADDRESS = process.env.DONOR_WALLET_ADDRESS!
    const KEY_ID = process.env.DONOR_KEY_ID!
    const PRIVATE_KEY_PATH = path.join(process.cwd(), 'app', 'api', 'donate', 'donor.key')
    console.log('HELLO', KEY_ID);
    const client = await createAuthenticatedClient({
      walletAddressUrl: WALLET_ADDRESS,
      privateKey: PRIVATE_KEY_PATH,
      keyId: KEY_ID
    })

    const walletAddress = await client.walletAddress.get({
      url: WALLET_ADDRESS
    })

    console.log('WALLET ADDRESS:', walletAddress, null, 2)

    return Response.json(walletAddress)
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Failed to fetch wallet address' }, { status: 500 })
  }
}