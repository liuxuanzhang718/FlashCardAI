'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'

export default function Onboarding() {
    const { user } = useAuth()
    const [nickname, setNickname] = useState('')
    const [age, setAge] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (user) {
            checkProfile()
        }
    }, [user])

    const checkProfile = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('nickname')
            .eq('id', user!.id)
            .single()

        if (data?.nickname) {
            router.push('/dashboard')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    nickname,
                    age: parseInt(age),
                    updated_at: new Date().toISOString(),
                })

            if (error) throw error
            router.push('/dashboard')
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">Welcome to FlashCard AI!</h1>
                    <p className="text-gray-500">Let's get to know you better.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., FlashMaster"
                            required
                            minLength={2}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                        <input
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 25"
                            required
                            min={1}
                            max={120}
                        />
                    </div>

                    <Button type="submit" className="w-full h-11" disabled={loading}>
                        {loading ? 'Saving...' : 'Get Started'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
