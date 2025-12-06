'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { OtpInput } from '@/components/ui/otp-input'

export default function Login() {
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [showOTP, setShowOTP] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: true,
                }
            })
            if (error) throw error
            setShowOTP(true)
            alert('Check your email for the login code!')
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async () => {
        setLoading(true)
        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'email',
            })
            if (error) throw error

            // Check if profile exists, if not redirect to onboarding
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('nickname')
                    .eq('id', user.id)
                    .single()

                if (!profile?.nickname) {
                    router.push('/onboarding')
                } else {
                    router.push('/dashboard')
                }
            }
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-6 text-center">Log in to FlashCard AI</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="you@example.com"
                            required
                            disabled={showOTP}
                        />
                    </div>

                    {showOTP ? (
                        <div className="space-y-6">
                            <div className="text-center">
                                <label className="block text-sm font-medium text-gray-700 mb-4">Enter Verification Code</label>
                                <OtpInput
                                    value={otp}
                                    onChange={setOtp}
                                    disabled={loading}
                                />
                            </div>
                            <Button
                                type="button"
                                onClick={handleVerifyOtp}
                                className="w-full h-11"
                                disabled={loading || otp.length !== 6}
                            >
                                {loading ? 'Verifying...' : 'Verify & Login'}
                            </Button>
                            <button
                                type="button"
                                onClick={() => setShowOTP(false)}
                                className="w-full text-sm text-gray-500 hover:text-gray-700"
                            >
                                Back to Email
                            </button>
                        </div>
                    ) : (
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Sending code...' : 'Send Login Code'}
                        </Button>
                    )}
                </form>
            </div>
        </div>
    )
}
