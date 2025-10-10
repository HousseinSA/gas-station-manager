import { NextResponse } from "next/server"
import { getDb } from "@/src/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  const db = await getDb()
  const stations = await db.collection("stations").find().toArray()
  return NextResponse.json(stations)
}

export async function POST(req: Request) {
  const body = await req.json()
  const db = await getDb()
  const res = await db.collection("stations").insertOne(body)
  const created = await db
    .collection("stations")
    .findOne({ _id: res.insertedId })
  return NextResponse.json(created)
}

export async function PUT(req: Request) {
  const body = await req.json()
  if (!body || (!body.id && !body._id))
    return NextResponse.json({ error: "Missing id or _id" }, { status: 400 })
  const db = await getDb()
  const { id, _id, ...updates } = body
  // Determine identifier: support numeric id (number or numeric string),
  // an ObjectId hex string, or an object like { $oid: '...' } that some
  // serializers produce.
  const idCandidate: any = id ?? _id

  // Numeric id (either number or numeric string)
  if (typeof idCandidate === "number" || /^\d+$/.test(String(idCandidate))) {
    const numeric = Number(idCandidate)
    await db
      .collection("stations")
      .updateOne({ id: numeric }, { $set: updates })
    const updated = await db.collection("stations").findOne({ id: numeric })
    return NextResponse.json(updated)
  }

  // If _id is an object like { $oid: '...' }, extract the hex string
  const maybeOidStr = (() => {
    if (!idCandidate) return null
    if (typeof idCandidate === "string") return idCandidate
    if (typeof idCandidate === "object") {
      if (idCandidate.$oid) return String(idCandidate.$oid)
      if (idCandidate["$oid"]) return String(idCandidate["$oid"])
      if (idCandidate.toString) return idCandidate.toString()
    }
    return null
  })()

  if (!maybeOidStr)
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  try {
    const oid = new ObjectId(maybeOidStr)
    await db.collection("stations").updateOne({ _id: oid }, { $set: updates })
    const updated = await db.collection("stations").findOne({ _id: oid })
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const idParam = searchParams.get("id")
  if (!idParam)
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const db = await getDb()
  // Try numeric id first
  const num = Number(idParam)
  if (!Number.isNaN(num) && String(num) === idParam) {
    await db.collection("stations").deleteOne({ id: num })
    return NextResponse.json({ ok: true })
  }

  // Otherwise try ObjectId
  try {
    const oid = new ObjectId(idParam)
    await db.collection("stations").deleteOne({ _id: oid })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }
}
