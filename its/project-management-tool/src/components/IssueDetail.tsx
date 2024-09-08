"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"

type User = {
  id: string
}

type Issue = {
  id: string
  title: string
  content: string
  status: string
  assigneeId: string
}

export function IssueDetail({
  projectId,
  issueId,
}: {
  projectId: string
  issueId: string
}) {
  const [issue, setIssue] = useState<Issue | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchIssue()
    fetchUsers()
  }, [issueId])

  const fetchIssue = async () => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/issues/${issueId}`
      )
      if (!response.ok) throw new Error("Failed to fetch issue")
      const data = await response.json()
      setIssue(data)
    } catch (err) {
      setError("Failed to load issue. Please try again.")
    } finally {
      setLoading(false)
    }
  }

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!issue) return

    try {
      const response = await fetch(
        `/api/projects/${projectId}/issues/${issueId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: issue.title,
            content: issue.content,
            status: issue.status,
            assigneeId: issue.assigneeId, // 여기서 assigneeId를 전송합니다
          }),
        }
      )

      if (!response.ok) throw new Error("Failed to update issue")

      const updatedIssue = await response.json()
      setIssue(updatedIssue)
      setIsEditing(false)
    } catch (err) {
      setError("Failed to update issue. Please try again.")
    }
  }

  if (loading) return <p>Loading issue...</p>
  if (error) return <p className="text-red-500">{error}</p>
  if (!issue) return <p>Issue not found.</p>

  return (
    <div>
      {isEditing ? (
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label htmlFor="title" className="block mb-1">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={issue.title}
              onChange={(e) => setIssue({ ...issue, title: e.target.value })}
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
              value={issue.content}
              onChange={(e) => setIssue({ ...issue, content: e.target.value })}
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
              value={issue.status}
              onChange={(e) => setIssue({ ...issue, status: e.target.value })}
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
              value={issue.assigneeId}
              onChange={(e) =>
                setIssue({ ...issue, assigneeId: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.id}
                </option>
              ))}
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4">{issue.title}</h1>
          <p className="mb-4">{issue.content}</p>
          <p className="mb-2">Status: {issue.status}</p>
          <p className="mb-2">Assignee: {issue.assigneeId}</p>
          {user && user.id === issue.assigneeId && (
            <p className="text-green-600">You are assigned to this issue.</p>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Edit Issue
          </button>
        </>
      )}
    </div>
  )
}
