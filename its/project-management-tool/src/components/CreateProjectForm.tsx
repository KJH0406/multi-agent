"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"

type CreateProjectFormProps = {
  onProjectCreated: (project: any) => void
}

export function CreateProjectForm({
  onProjectCreated,
}: CreateProjectFormProps) {
  const [projectName, setProjectName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    setError(null)

    if (!user) {
      setError("You must be logged in to create a project.")
      return
    }

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, creatorId: user.id }),
      })

      if (!response.ok) throw new Error("Failed to create project")

      const newProject = await response.json()
      setProjectName("")
      onProjectCreated(newProject)
    } catch (err) {
      setError("Failed to create project. Please try again.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex items-center">
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Enter project name"
          className="flex-grow px-3 py-2 border rounded-l-md"
          required
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
        >
          Create Project
        </button>
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </form>
  )
}
