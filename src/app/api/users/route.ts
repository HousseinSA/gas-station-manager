import { NextResponse } from "next/server"
import { getDb } from "@/src/lib/mongodb"

export async function GET() {
  const db = await getDb()
  const users = await db.collection("users").find().toArray()
  return NextResponse.json(
    users.map((u: any) => ({ ...u, password: undefined }))
  )
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!body || !body.name || !body.password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }
  const db = await getDb()
  const existing = await db.collection("users").findOne({ name: body.name })
  if (existing)
    return NextResponse.json({ error: "User exists" }, { status: 400 })
  const user = { ...body, id: Date.now(), isAdmin: !!body.isAdmin }
  await db.collection("users").insertOne(user)
  return NextResponse.json({ ...user, password: undefined })
}

export async function PUT(req: Request) {
  const body = await req.json()
  if (!body || !body.id)
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const db = await getDb()
  await db.collection("users").updateOne({ id: body.id }, { $set: body })
  const updated = await db.collection("users").findOne({ id: body.id })
  return NextResponse.json({ ...updated, password: undefined })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const idParam = searchParams.get("id")
  if (!idParam)
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const id = Number(idParam)
  const db = await getDb()
  await db.collection("users").deleteOne({ id })
  return NextResponse.json({ ok: true })
}
