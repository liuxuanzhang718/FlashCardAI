'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { Loader2 } from 'lucide-react'

export function LandingHeader() {
    const { user, loading } = useAuth()

    return (
        <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
            <div className="text-xl font-semibold tracking-tight">FlashCard AI</div>
            <div className="space-x-4 flex items-center">
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : user ? (
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-600">
                            {user.email}
                        </span>
                        <Link href="/dashboard">
                            <Button className="rounded-full px-6">Go to Dashboard</Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">
                            Log in
                        </Link>
                        <Link href="/login">
                            <Button className="rounded-full px-6">Get Started</Button>
                        </Link>
                    </>
                )}
            </div>
        </nav>
    )
}
