import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: Request) {
  const { userId } = await request.json()

  try {
    let user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      user = await prisma.user.create({ data: { id: userId } })
    }
    return NextResponse.json({ user })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
