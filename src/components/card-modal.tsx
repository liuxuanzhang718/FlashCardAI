'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface CardModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (front: string, back: string) => void
    initialFront?: string
    initialBack?: string
    title?: string
}

export function CardModal({ isOpen, onClose, onSave, initialFront = '', initialBack = '', title = 'Add Card' }: CardModalProps) {
    const [front, setFront] = useState(initialFront)
    const [back, setBack] = useState(initialBack)

    useEffect(() => {
        setFront(initialFront)
        setBack(initialBack)
    }, [initialFront, initialBack, isOpen])

    const handleSave = () => {
        if (front.trim() && back.trim()) {
            onSave(front, back)
            setFront('')
            setBack('')
            onClose()
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                    <h2 className="text-2xl font-bold">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Front (Question)</label>
                        <textarea
                            value={front}
                            onChange={(e) => setFront(e.target.value)}
                            placeholder="What is the capital of France?"
                            className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-y"
                        />
                        <p className="text-xs text-gray-500 mt-1">Supports Markdown and LaTeX ($E=mc^2$)</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Back (Answer)</label>
                        <textarea
                            value={back}
                            onChange={(e) => setBack(e.target.value)}
                            placeholder="Paris"
                            className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-y"
                        />
                        <p className="text-xs text-gray-500 mt-1">Be concise but complete</p>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 sticky bottom-0 bg-white">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!front.trim() || !back.trim()}>
                        Save Card
                    </Button>
                </div>
            </div>
        </div>
    )
}
