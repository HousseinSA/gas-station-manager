import { NextResponse } from "next/server"
import { getDb } from "@/src/lib/mongodb"

export async function GET() {
  const db = await getDb()
  const items = await db.collection("indexHistory").find().toArray()
  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const body = await req.json()
  const db = await getDb()
  const res = await db.collection("indexHistory").insertOne(body)
  const created = await db
    .collection("indexHistory")
    .findOne({ _id: res.insertedId })
  return NextResponse.json(created)
}
