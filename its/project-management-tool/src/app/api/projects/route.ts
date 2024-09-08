import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: { creator: true },
    })
    return NextResponse.json(projects)
  } catch (error) {
    console.error("Failed to fetch projects:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { name, creatorId } = await request.json()

    const user = await prisma.user.findUnique({
      where: { id: creatorId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const project = await prisma.project.create({
      data: { name, creatorId },
      include: { creator: true },
    })
    return NextResponse.json(project)
  } catch (error) {
    console.error("Failed to create project:", error)
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}
