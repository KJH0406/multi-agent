"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/") // 로그아웃 후 메인 페이지(로그인 페이지)로 리디렉션
  }

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          PROJECT MAMAGEMENT
        </Link>
        <div>
          {user && (
            <>
              <span className="mr-4">Welcome, {user.id}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
