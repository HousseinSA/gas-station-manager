import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/src/lib/mongodb"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const includePassword = searchParams.get("includePassword") === "true"
    
    const db = await getDb()
    const users = await db.collection("users").find().toArray()
    console.log("Users API - Found users:", users.length)
    return NextResponse.json(
      users.map((u: any) => {
        const user = includePassword ? u : { ...u, password: undefined }
        // Ensure id field is properly set (use _id if id doesn't exist)
        if (!user.id && user._id) {
          user.id = user._id
        }
        return user
      })
    )
  } catch (error) {
    console.error("Users API - Error:", error)
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
  }
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
  
  // Try to find by id first, then by _id
  let updated = await db.collection("users").findOne({ id: body.id })
  if (!updated) {
    updated = await db.collection("users").findOne({ _id: body.id })
  }
  
  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }
  
  // Update using the correct field
  const updateQuery = updated.id ? { id: body.id } : { _id: body.id }
  await db.collection("users").updateOne(updateQuery, { $set: body })
  
  // Get the updated user
  updated = await db.collection("users").findOne(updateQuery)
  
  if (!updated) {
    return NextResponse.json({ error: "Failed to retrieve updated user" }, { status: 500 })
  }
  
  // Ensure id field is properly set
  if (!updated.id && updated._id) {
    updated.id = updated._id
  }
  
  return NextResponse.json(updated) // Return with password for editing
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const idParam = searchParams.get("id")
  if (!idParam)
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  
  const db = await getDb()
  
  // Try to delete by id first (as number), then as string, then by _id
  let result = await db.collection("users").deleteOne({ id: Number(idParam) })
  if (result.deletedCount === 0) {
    result = await db.collection("users").deleteOne({ id: idParam })
  }
  if (result.deletedCount === 0) {
    try {
      result = await db.collection("users").deleteOne({ _id: new ObjectId(idParam) })
    } catch (e) {
      // Invalid ObjectId, user not found
      result = { deletedCount: 0, acknowledged: true }
    }
  }
  
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }
  
  return NextResponse.json({ ok: true })
}
