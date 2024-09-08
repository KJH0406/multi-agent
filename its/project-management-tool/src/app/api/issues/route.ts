import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { title, content, status, projectId, assigneeId } =
      await request.json()

    // 프로젝트와 사용자가 존재하는지 확인
    const [project, user] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.user.findUnique({ where: { id: assigneeId } }),
    ])

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const issue = await prisma.issue.create({
      data: { title, content, status, projectId, assigneeId },
      include: { assignee: true },
    })
    return NextResponse.json(issue)
  } catch (error) {
    console.error("Failed to create issue:", error)
    return NextResponse.json(
      { error: "Failed to create issue" },
      { status: 500 }
    )
  }
}
