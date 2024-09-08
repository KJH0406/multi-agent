"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

type Project = {
  id: string
  name: string
  creator: {
    id: string
  }
}

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (!response.ok) throw new Error("Failed to fetch projects")
      const data = await response.json()
      setProjects(data)
    } catch (err) {
      setError("Failed to load projects. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p>Loading projects...</p>
  if (error) return <p className="text-red-500">{error}</p>

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {projects.map((project) => (
          <li key={project.id}>
            <Link
              href={`/projects/${project.id}`}
              className="block hover:bg-gray-50"
            >
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    {project.name}
                  </p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {project.creator.id}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
