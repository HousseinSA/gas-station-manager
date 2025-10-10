import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/src/lib/mongodb"

export async function POST(req: Request) {
  // Login: expect { password }
  const body = await req.json()
  if (!body || !body.password)
    return NextResponse.json({ error: "Missing password" }, { status: 400 })
  const db = await getDb()
  // Check admin first
  let admin = await db.collection("users").findOne({ isAdmin: true })
  // If no admin exists in DB, create a default one for compatibility
  if (!admin) {
    const defaultAdmin = {
      id: 1,
      name: "Admin",
      password: "admin123",
      isAdmin: true,
      allowedStations: [],
    }
    const r = await db.collection("users").insertOne(defaultAdmin)
    admin = await db.collection("users").findOne({ _id: r.insertedId })
  }
  if (admin && admin.password === body.password) {
    const res = NextResponse.json({
      ok: true,
      user: { id: admin.id, name: admin.name, isAdmin: true },
    })
    // Set session cookie for 6 hours (21600 seconds)
    res.headers.set(
      "Set-Cookie",
      `userId=${String(
        admin.id
      )}; Path=/; HttpOnly; Max-Age=21600; SameSite=Lax`
    )
    return res
  }
  // Otherwise find non-admin
  const user = await db
    .collection("users")
    .findOne({ password: body.password, isAdmin: { $ne: true } })
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })
  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, isAdmin: user.isAdmin, allowedStations: user.allowedStations || [] },
  })
  res.headers.set(
    "Set-Cookie",
    `userId=${String(user.id)}; Path=/; HttpOnly; Max-Age=21600; SameSite=Lax`
  )
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.headers.set("Set-Cookie", `userId=; Path=/; HttpOnly; Max-Age=0`)
  return res
}

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || ""
  const parts = cookie.split("; ")
  const pair = parts.find((p) => p.startsWith("userId="))
  if (!pair) return NextResponse.json({ user: null })
  const idStr = pair.split("=")[1]
  if (!idStr) return NextResponse.json({ user: null })

  const db = await getDb()
  // If id is numeric, look up by numeric id field; otherwise try ObjectId
  let user: any = null
  if (/^\d+$/.test(idStr)) {
    user = await db.collection("users").findOne({ id: Number(idStr) })
  } else {
    try {
      user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(String(idStr)) })
    } catch (e) {
      // ignore invalid ObjectId
    }
  }

  if (!user) return NextResponse.json({ user: null })
  return NextResponse.json({
    user: { id: user.id ?? user._id, name: user.name, isAdmin: user.isAdmin, allowedStations: user.allowedStations || [] },
  })
}
