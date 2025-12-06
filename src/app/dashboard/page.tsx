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
    const [nickname, setNickname] = useState('')

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user])

    async function fetchData() {
        try {
            // Fetch profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('nickname')
                .eq('id', user!.id)
                .single()

            if (!profile?.nickname) {
                router.push('/onboarding')
                return
            }
            setNickname(profile.nickname)

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
        <div className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="mb-12 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 tracking-tight text-gray-900">Welcome, {nickname}!</h1>
                        <p className="text-lg text-gray-500 font-medium">Ready to master something new today?</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard/upload">
                            <Button className="h-12 px-6 rounded-full bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all text-base font-medium">
                                <Plus className="w-5 h-5 mr-2" /> New Deck
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            className="h-12 px-6 rounded-full border-gray-200 hover:bg-gray-50 text-gray-600"
                            onClick={async () => {
                                await supabase.auth.signOut()
                                router.push('/login')
                            }}
                        >
                            Sign Out
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                ) : (
                    <>
                        {/* Analytics Section */}
                        <div className="mb-12">
                            <DashboardAnalytics cards={allCards} />
                        </div>

                        {/* Decks Grid */}
                        <div>
                            <h2 className="text-2xl font-bold mb-6 tracking-tight text-gray-900">Your Decks</h2>

                            {decks.length === 0 ? (
                                <div className="text-center py-24 glass rounded-3xl border-0">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                                        <Book className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2 text-gray-900">No decks yet</h3>
                                    <p className="text-gray-500 mb-8 max-w-md mx-auto">Create your first deck from a PDF to start learning efficiently.</p>
                                    <Link href="/dashboard/upload">
                                        <Button variant="outline" className="h-11 px-8 rounded-full border-gray-300 hover:bg-gray-50">Create Deck</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {decks.map((deck) => (
                                        <div
                                            key={deck.id}
                                            onClick={() => router.push(`/study/${deck.id}`)}
                                            className="group relative bg-white rounded-3xl p-6 shadow-apple hover:shadow-apple-hover transition-all duration-300 cursor-pointer border border-white/50 hover:-translate-y-1"
                                        >
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                                    <Book className="w-6 h-6" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {deck.due_count! > 0 && (
                                                        <span className="bg-red-50 text-red-600 text-xs font-bold px-3 py-1 rounded-full flex items-center border border-red-100">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {deck.due_count}
                                                        </span>
                                                    )}
                                                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setMenuOpen(menuOpen === deck.id ? null : deck.id)
                                                            }}
                                                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                                        >
                                                            <MoreVertical className="w-5 h-5" />
                                                        </button>
                                                        {menuOpen === deck.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                                                                <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden z-20 ring-1 ring-black/5">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            router.push(`/deck/${deck.id}`)
                                                                        }}
                                                                        className="w-full px-4 py-3 text-left hover:bg-gray-50/50 flex items-center text-sm font-medium text-gray-700"
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
                                                                        className="w-full px-4 py-3 text-left hover:bg-red-50/50 flex items-center text-sm font-medium text-red-600"
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

                                            <div>
                                                <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">{deck.name}</h3>
                                                <p className="text-sm text-gray-500 font-medium">
                                                    Created {new Date(deck.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>

                                            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between text-sm font-medium text-gray-500">
                                                <span>Flashcards</span>
                                                <span className="flex items-center text-blue-600 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                                                    Study Now <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
