"use client"

import { useState, useEffect } from "react"
import { IssueList } from "./IssueList"
import { CreateIssueForm } from "./CreateIssueForm"

type Project = {
  id: string
  name: string
  creator: {
    id: string
  }
  issues: Issue[]
}

type Issue = {
  id: string
  title: string
  content: string
  status: string
  assignee: {
    id: string
  }
}

export function ProjectDetail({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) throw new Error("Failed to fetch project")
      const data = await response.json()
      setProject(data)
    } catch (err) {
      setError("Failed to load project. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p>Loading project...</p>
  if (error) return <p className="text-red-500">{error}</p>
  if (!project) return <p>Project not found.</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{project.name}</h1>
      <p className="mb-4">Created by: {project.creator.id}</p>
      <h2 className="text-xl font-semibold mb-2">Issues</h2>
      <CreateIssueForm projectId={projectId} onIssueCreated={fetchProject} />
      <IssueList projectId={projectId} issues={project.issues} />
    </div>
  )
}
