import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { id: string; issueId: string } }
) {
  try {
    const issue = await prisma.issue.findUnique({
      where: {
        id: params.issueId,
        projectId: params.id,
      },
      include: { assignee: true },
    })

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 })
    }

    return NextResponse.json(issue)
  } catch (error) {
    console.error("Failed to fetch issue:", error)
    return NextResponse.json(
      { error: "Failed to fetch issue" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; issueId: string } }
) {
  try {
    const { title, content, status, assigneeId } = await request.json()

    const updatedIssue = await prisma.issue.update({
      where: {
        id: params.issueId,
        projectId: params.id,
      },
      data: {
        title,
        content,
        status,
        assigneeId,
      },
    })

    return NextResponse.json(updatedIssue)
  } catch (error) {
    console.error("Failed to update issue:", error)
    return NextResponse.json(
      { error: "Failed to update issue" },
      { status: 500 }
    )
  }
}
