"use client"

import { useState } from "react"
import { ProjectList } from "@/components/ProjectList"
import { CreateProjectForm } from "@/components/CreateProjectForm"

type Project = {
  id: string
  name: string
  creator: {
    id: string
  }
}
export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])

  const handleProjectCreated = (newProject: Project) => {
    setProjects([...projects, newProject])
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
      <CreateProjectForm onProjectCreated={handleProjectCreated} />
      <ProjectList />
    </div>
  )
}
