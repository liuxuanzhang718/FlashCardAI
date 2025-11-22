'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { calculateReview, mapButtonToGrade } from '@/lib/anki'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { MarkdownRenderer } from '@/components/markdown-renderer'

interface Card {
    id: string
    front: string
    back: string
    interval: number
    repetition: number
    efactor: number
}

export default function StudyPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const mode = searchParams.get('mode') || 'review' // 'review' or 'practice'
    const [cards, setCards] = useState<Card[]>([])
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [againCards, setAgainCards] = useState<Card[]>([])
    const [loading, setLoading] = useState(true)
    const [finished, setFinished] = useState(false)

    useEffect(() => {
        fetchCards()
    }, [mode])

    async function fetchCards() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            let query = supabase
                .from('cards')
                .select('*')
                .eq('deck_id', params.deckId)

            if (mode === 'review') {
                // Only due cards
                const now = new Date().toISOString()
                query = query.lte('next_review', now)
            }
            // If mode === 'practice', fetch all cards

            const { data, error } = await query.order('next_review', { ascending: true })

            if (error) throw error
            setCards(data || [])
        } catch (error) {
            console.error('Error fetching cards:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRate = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
        const card = cards[currentCardIndex]

        // Handle "Again" - add card back to queue
        if (rating === 'again') {
            setAgainCards(prev => [...prev, card])
        }

        if (mode === 'review') {
            // Update spaced repetition data
            const grade = mapButtonToGrade(rating)
            const result = calculateReview(grade, card.interval, card.repetition, card.efactor)

            const nextReviewDate = new Date()
            nextReviewDate.setDate(nextReviewDate.getDate() + result.interval)

            // Optimistic update: Fire and forget
            supabase
                .from('cards')
                .update({
                    interval: result.interval,
                    repetition: result.repetition,
                    efactor: result.efactor,
                    next_review: nextReviewDate.toISOString()
                })
                .eq('id', card.id)
                .then(({ error }) => {
                    if (error) console.error('Error updating card:', error)
                })
        }
        // In practice mode, don't update anything

        // Move to next card
        if (currentCardIndex < cards.length - 1) {
            // Fix: First flip back to front, THEN update index
            setIsFlipped(false)
            // Wait for flip animation to reach 90 degrees (halfway) before changing content
            // Animation duration is 0.4s, so 90 degrees is at 0.2s
            setTimeout(() => {
                setCurrentCardIndex(prev => prev + 1)
            }, 200)
        } else {
            // Check if we have cards to review again
            if (againCards.length > 0) {
                setIsFlipped(false)
                setTimeout(() => {
                    setCards(againCards)
                    setAgainCards([])
                    setCurrentCardIndex(0)
                }, 200)
            } else {
                setFinished(true)
            }
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>

    if (finished || cards.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">
                        {mode === 'practice' ? 'Practice complete!' : 'All caught up!'}
                    </h2>
                    <p className="text-gray-500 mb-8">
                        {mode === 'practice'
                            ? "You've practiced all cards in this deck. Great work!"
                            : "You've reviewed all due cards for this deck. Great job!"
                        }
                    </p>
                    <div className="space-y-3">
                        <Link href="/dashboard">
                            <Button size="lg" className="w-full">Back to Dashboard</Button>
                        </Link>
                        {mode === 'review' && cards.length === 0 && (
                            <Link href={`/study/${params.deckId}?mode=practice`}>
                                <Button size="lg" variant="outline" className="w-full">
                                    <GraduationCap className="w-5 h-5 mr-2" />
                                    Practice All Cards
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const currentCard = cards[currentCardIndex]

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center justify-between max-w-3xl mx-auto w-full">
                <Link href="/dashboard" className="text-gray-500 hover:text-black">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div className="flex items-center gap-3">
                    {mode === 'practice' && (
                        <span className="text-xs font-medium px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                            Practice Mode
                        </span>
                    )}
                    <div className="text-sm font-medium text-gray-500">
                        {currentCardIndex + 1} / {cards.length}
                    </div>
                </div>
                <div className="w-6" /> {/* Spacer */}
            </div>

            {/* Card Area */}
            <div className="flex-1 flex items-center justify-center p-4 perspective-1000">
                <div
                    className="relative w-full max-w-2xl aspect-[3/2] cursor-pointer group"
                    onClick={() => !isFlipped && setIsFlipped(true)}
                >
                    <motion.div
                        className="w-full h-full relative preserve-3d"
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Front */}
                        <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl flex items-center justify-center p-8 text-center border border-gray-200 overflow-y-auto">
                            <div className="w-full">
                                <MarkdownRenderer content={currentCard.front} />
                            </div>
                            <div className="absolute bottom-6 text-sm text-gray-400 font-medium">
                                Tap to flip
                            </div>
                        </div>

                        {/* Back */}
                        <div
                            className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl flex items-center justify-center p-8 text-center border border-gray-200"
                            style={{ transform: 'rotateY(180deg)' }}
                        >
                            <div className="w-full overflow-y-auto max-h-full">
                                <MarkdownRenderer content={currentCard.back} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Controls */}
            <div className="h-32 bg-white border-t border-gray-200 p-4 flex items-center justify-center">
                {!isFlipped ? (
                    <Button size="lg" className="w-full max-w-xs text-lg h-14 rounded-xl" onClick={() => setIsFlipped(true)}>
                        Show Answer
                    </Button>
                ) : (
                    <div className="grid grid-cols-4 gap-4 w-full max-w-2xl">
                        <Button
                            variant="destructive"
                            className="h-14 flex flex-col gap-1 bg-red-100 text-red-700 hover:bg-red-200 border-0"
                            onClick={() => handleRate('again')}
                        >
                            <span className="font-bold">Again</span>
                            <span className="text-xs opacity-70">&lt; 1m</span>
                        </Button>
                        <Button
                            className="h-14 flex flex-col gap-1 bg-orange-100 text-orange-700 hover:bg-orange-200 border-0"
                            onClick={() => handleRate('hard')}
                        >
                            <span className="font-bold">Hard</span>
                            <span className="text-xs opacity-70">2d</span>
                        </Button>
                        <Button
                            className="h-14 flex flex-col gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0"
                            onClick={() => handleRate('good')}
                        >
                            <span className="font-bold">Good</span>
                            <span className="text-xs opacity-70">3d</span>
                        </Button>
                        <Button
                            className="h-14 flex flex-col gap-1 bg-green-100 text-green-700 hover:bg-green-200 border-0"
                            onClick={() => handleRate('easy')}
                        >
                            <span className="font-bold">Easy</span>
                            <span className="text-xs opacity-70">4d</span>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
