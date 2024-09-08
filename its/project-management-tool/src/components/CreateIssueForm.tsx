"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"

type User = {
  id: string
}

type CreateIssueFormProps = {
  projectId: string
  onIssueCreated: () => void
}

export function CreateIssueForm({
  projectId,
  onIssueCreated,
}: CreateIssueFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [status, setStatus] = useState("TODO")
  const [assigneeId, setAssigneeId] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (user) {
      setAssigneeId(user.id)
    }
  }, [user])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      console.error("Error fetching users:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          status,
          projectId,
          assigneeId,
        }),
      })

      if (!response.ok) throw new Error("Failed to create issue")

      setTitle("")
      setContent("")
      setStatus("TODO")
      onIssueCreated()
    } catch (err) {
      setError("Failed to create issue. Please try again.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-4">
      <div>
        <label htmlFor="title" className="block mb-1">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label htmlFor="content" className="block mb-1">
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label htmlFor="status" className="block mb-1">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
      </div>
      <div>
        <label htmlFor="assignee" className="block mb-1">
          Assignee
        </label>
        <select
          id="assignee"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.id}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Create Issue
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </form>
  )
}
