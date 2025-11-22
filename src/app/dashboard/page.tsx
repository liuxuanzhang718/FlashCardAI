'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Book, Clock, MoreVertical, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'

import { DashboardAnalytics } from '@/components/dashboard-analytics'

interface Deck {
    id: string
    name: string
    created_at: string
    due_count?: number
}

export default function Dashboard() {
    const { user } = useAuth()
    const [decks, setDecks] = useState<Deck[]>([])
    const [loading, setLoading] = useState(true)
    const [menuOpen, setMenuOpen] = useState<string | null>(null)
    const router = useRouter()
    const [allCards, setAllCards] = useState<any[]>([])

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user])

    async function fetchData() {
        try {
            // Fetch decks
            const { data: decksData, error: decksError } = await supabase
                .from('decks')
                .select('*')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false })

            if (decksError) throw decksError

            // Fetch ALL cards for analytics and counts
            // We can optimize this later if card count gets huge, but for now it's fine
            const { data: cardsData, error: cardsError } = await supabase
                .from('cards')
                .select('id, deck_id, interval, repetition, efactor, next_review')
                .in('deck_id', decksData.map(d => d.id))

            if (cardsError) throw cardsError

            setAllCards(cardsData || [])

            // Calculate due counts from the fetched cards
            const decksWithCounts = decksData.map(deck => {
                const deckCards = cardsData?.filter(c => c.deck_id === deck.id) || []
                const dueCount = deckCards.filter(c =>
                    c.next_review && new Date(c.next_review) <= new Date()
                ).length

                return {
                    ...deck,
                    due_count: dueCount
                }
            })

            setDecks(decksWithCounts)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleDeleteDeck(deckId: string) {
        if (!confirm('Are you sure you want to delete this deck? All cards will be deleted.')) return

        try {
            // Delete cards first
            await supabase.from('cards').delete().eq('deck_id', deckId)
            // Then delete deck
            await supabase.from('decks').delete().eq('id', deckId)
            // Refresh list
            fetchData()
        } catch (error) {
            console.error('Error deleting deck:', error)
            alert('Failed to delete deck')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-gray-500 hover:text-black mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        <span className="font-medium">Back to Home</span>
                    </Link>
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold">My Decks</h1>
                        <Link href="/dashboard/upload">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" /> New Deck
                            </Button>
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <>
                        <DashboardAnalytics cards={allCards} />

                        {decks.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                <p className="text-gray-500 mb-4">No decks yet.</p>
                                <Link href="/dashboard/upload">
                                    <Button variant="outline">Create your first deck</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-3 gap-6">
                                {decks.map((deck) => (
                                    <div key={deck.id} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col justify-between relative overflow-hidden group">
                                        <div>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                                    <Book className="w-6 h-6" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {deck.due_count! > 0 && (
                                                        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {deck.due_count} Due
                                                        </span>
                                                    )}
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setMenuOpen(menuOpen === deck.id ? null : deck.id)
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                        >
                                                            <MoreVertical className="w-5 h-5 text-gray-500" />
                                                        </button>
                                                        {menuOpen === deck.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-20">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            router.push(`/deck/${deck.id}`)
                                                                        }}
                                                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center text-sm"
                                                                    >
                                                                        <Edit className="w-4 h-4 mr-3 text-gray-500" />
                                                                        Edit Deck
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            setMenuOpen(null)
                                                                            handleDeleteDeck(deck.id)
                                                                        }}
                                                                        className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center text-sm text-red-600"
                                                                    >
                                                                        <Trash2 className="w-4 h-4 mr-3" />
                                                                        Delete Deck
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div onClick={() => router.push(`/study/${deck.id}`)}>
                                                <h3 className="text-xl font-semibold mb-2">{deck.name}</h3>
                                                <p className="text-sm text-gray-500">
                                                    Created {new Date(deck.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        {deck.due_count! > 0 && (
                                            <div
                                                onClick={() => router.push(`/study/${deck.id}`)}
                                                className="mt-4 w-full bg-blue-600 text-white text-center py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Study Now
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
