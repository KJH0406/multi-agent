"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export function LoginForm() {
  const [userId, setUserId] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      if (!response.ok) throw new Error("Login failed")
      const data = await response.json()
      login(data.user.id)
      router.push("/projects")
    } catch (err) {
      setError("Login failed. Please try again.")
    }
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="userId" className="sr-only">
            User ID
          </label>
          <input
            id="userId"
            name="userId"
            type="text"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Sign in
        </button>
      </div>
    </form>
  )
}
