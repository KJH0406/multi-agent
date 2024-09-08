import { AuthProvider } from "@/contexts/AuthContext"
import { Navbar } from "@/components/Navbar"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="container mx-auto mt-4">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
