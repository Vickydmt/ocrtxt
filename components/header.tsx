"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Menu } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const isActive = (path: string) => {
    return pathname === path ? "text-primary font-medium" : "text-foreground/80 hover:text-primary"
  }

  return (
    <header className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold">
              DocuDigitize
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/upload" className={`text-sm ${isActive("/upload")}`}>
              Upload
            </Link>
            <Link href="/documents" className={`text-sm ${isActive("/documents")}`}>
              Documents
            </Link>
            <Link href="/how-it-works" className={`text-sm ${isActive("/how-it-works")}`}>
              How It Works
            </Link>
            <Link href="/about" className={`text-sm ${isActive("/about")}`}>
              About
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <ModeToggle />
            {user ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="default" size="sm" onClick={() => logout()}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </div>

          <div className="flex md:hidden">
            <ModeToggle />
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="ml-2">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t py-4">
          <div className="container mx-auto px-4 space-y-4">
            <Link
              href="/upload"
              className={`block text-sm ${isActive("/upload")}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Upload
            </Link>
            <Link
              href="/documents"
              className={`block text-sm ${isActive("/documents")}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Documents
            </Link>
            <Link
              href="/how-it-works"
              className={`block text-sm ${isActive("/how-it-works")}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="/about"
              className={`block text-sm ${isActive("/about")}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <div className="pt-4 border-t flex flex-col space-y-2">
              {user ? (
                <>
                  <Button variant="outline" size="sm" asChild className="justify-start">
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      Dashboard
                    </Link>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    className="justify-start"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" asChild className="justify-start">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      Login
                    </Link>
                  </Button>
                  <Button variant="default" size="sm" asChild className="justify-start">
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      Register
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

