'use client'

import React, { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface OtpInputProps {
    length?: number
    value: string
    onChange: (value: string) => void
    disabled?: boolean
}

export function OtpInput({ length = 6, value, onChange, disabled = false }: OtpInputProps) {
    const [otp, setOtp] = useState<string[]>(new Array(length).fill(''))
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        // Sync internal state with external value prop
        const newOtp = value.split('').slice(0, length)
        while (newOtp.length < length) newOtp.push('')
        setOtp(newOtp)
    }, [value, length])

    const focusInput = (index: number) => {
        inputRefs.current[index]?.focus()
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value
        if (isNaN(Number(val))) return

        const newOtp = [...otp]
        // Allow only last character if multiple entered (though maxLength handles this usually)
        newOtp[index] = val.substring(val.length - 1)

        setOtp(newOtp)
        onChange(newOtp.join(''))

        // Auto-focus next input
        if (val && index < length - 1) {
            focusInput(index + 1)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                // If empty and backspace pressed, move to previous
                focusInput(index - 1)
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            focusInput(index - 1)
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            focusInput(index + 1)
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text/plain').slice(0, length)
        if (!/^\d+$/.test(pastedData)) return // Only allow numbers

        const newOtp = pastedData.split('')
        while (newOtp.length < length) newOtp.push('')

        setOtp(newOtp)
        onChange(newOtp.join(''))

        // Focus the last filled input or the first empty one
        const lastFilledIndex = Math.min(pastedData.length, length - 1)
        focusInput(lastFilledIndex)
    }

    return (
        <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className={cn(
                        "w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-white transition-all focus:outline-none focus:ring-4 focus:ring-blue-100",
                        digit ? "border-blue-500 text-blue-600" : "border-gray-200 text-gray-900",
                        disabled && "opacity-50 cursor-not-allowed bg-gray-50"
                    )}
                />
            ))}
        </div>
    )
}
