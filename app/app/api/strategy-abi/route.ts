import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = 'zync'
const COLLECTION_NAME = 'strategy-abis'

let cachedClient: MongoClient | null = null

async function getMongoClient() {
  if (cachedClient) {
    return cachedClient
  }

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  cachedClient = client
  return client
}

// POST - Store ABI for a strategy
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vaultAddress, strategyId, targetContractABI } = body

    if (!vaultAddress || strategyId === undefined || !targetContractABI) {
      return NextResponse.json(
        { error: 'Missing required fields: vaultAddress, strategyId, targetContractABI' },
        { status: 400 }
      )
    }

    const client = await getMongoClient()
    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)

    // Upsert the ABI document
    const result = await collection.updateOne(
      { vaultAddress: vaultAddress.toLowerCase(), strategyId: strategyId.toString() },
      {
        $set: {
          vaultAddress: vaultAddress.toLowerCase(),
          strategyId: strategyId.toString(),
          targetContractABI,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      message: 'ABI stored successfully',
      result: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount,
      },
    })
  } catch (error: any) {
    console.error('Error storing ABI:', error)
    return NextResponse.json(
      { error: 'Failed to store ABI', details: error.message },
      { status: 500 }
    )
  }
}

// GET - Retrieve ABI for a strategy
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vaultAddress = searchParams.get('vaultAddress')
    const strategyId = searchParams.get('strategyId')

    if (!vaultAddress || !strategyId) {
      return NextResponse.json(
        { error: 'Missing required query parameters: vaultAddress, strategyId' },
        { status: 400 }
      )
    }

    const client = await getMongoClient()
    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)

    const document = await collection.findOne({
      vaultAddress: vaultAddress.toLowerCase(),
      strategyId: strategyId,
    })

    if (!document) {
      return NextResponse.json(
        { error: 'ABI not found for the specified vault and strategy' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        vaultAddress: document.vaultAddress,
        strategyId: document.strategyId,
        targetContractABI: document.targetContractABI,
      },
    })
  } catch (error: any) {
    console.error('Error retrieving ABI:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve ABI', details: error.message },
      { status: 500 }
    )
  }
}
