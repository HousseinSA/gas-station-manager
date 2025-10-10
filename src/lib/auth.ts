import { getDb } from "./mongodb"

export async function getUserFromRequest(req: Request) {
  const cookie = req.headers.get("cookie") || ""
  const match = cookie.match(/(?:^|; )userId=(\d+)/)
  if (!match) return null
  const id = Number(match[1])
  const db = await getDb()
  const user = await db.collection("users").findOne({ id })
  return user || null
}
