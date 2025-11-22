'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Upload, Edit, Trash2, FileText, Loader2, File, X, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { CardModal } from '@/components/card-modal'
import { useAuth } from '@/components/auth-provider'
import { MarkdownRenderer } from '@/components/markdown-renderer'

interface Card {
    id: string
    front: string
    back: string
    source_pdf_id?: string
}

interface Deck {
    id: string
    name: string
    created_at: string
}

interface PDF {
    id: string
    name: string
    created_at: string
}

export default function DeckDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const [deck, setDeck] = useState<Deck | null>(null)
    const [cards, setCards] = useState<Card[]>([])
    const [pdfs, setPdfs] = useState<PDF[]>([])
    const [loading, setLoading] = useState(true)
    const [editingName, setEditingName] = useState(false)
    const [newName, setNewName] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [editingCard, setEditingCard] = useState<Card | null>(null)
    const [uploadingPDF, setUploadingPDF] = useState(false)
    const [cardCount, setCardCount] = useState(10)
    const [cardStyle, setCardStyle] = useState('mixed')

    useEffect(() => {
        if (user) {
            fetchDeckData()
        }
    }, [user])

    async function fetchDeckData() {
        try {
            // Fetch deck
            const { data: deckData, error: deckError } = await supabase
                .from('decks')
                .select('*')
                .eq('id', params.deckId)
                .single()

            if (deckError) throw deckError
            setDeck(deckData)
            setNewName(deckData.name)

            // Fetch cards
            const { data: cardsData, error: cardsError } = await supabase
                .from('cards')
                .select('*')
                .eq('deck_id', params.deckId)
                .order('created_at', { ascending: false })

            if (cardsError) throw cardsError
            setCards(cardsData || [])

            // Fetch PDFs
            const { data: pdfsData, error: pdfsError } = await supabase
                .from('pdfs')
                .select('*')
                .eq('deck_id', params.deckId)
                .order('created_at', { ascending: false })

            if (pdfsError) {
                // Ignore error if table doesn't exist yet (migration pending)
                console.warn('Error fetching PDFs (table might not exist):', pdfsError)
            } else {
                setPdfs(pdfsData || [])
            }
        } catch (error) {
            console.error('Error fetching deck data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSaveName() {
        if (!newName.trim()) return

        try {
            await supabase
                .from('decks')
                .update({ name: newName })
                .eq('id', params.deckId)

            setDeck({ ...deck!, name: newName })
            setEditingName(false)
        } catch (error) {
            console.error('Error updating deck name:', error)
            alert('Failed to update deck name')
        }
    }

    async function handleSaveCard(front: string, back: string) {
        try {
            if (editingCard) {
                // Update existing card
                await supabase
                    .from('cards')
                    .update({ front, back })
                    .eq('id', editingCard.id)
            } else {
                // Create new card
                await supabase
                    .from('cards')
                    .insert({
                        deck_id: params.deckId,
                        front,
                        back,
                    })
            }

            setEditingCard(null)
            fetchDeckData()
        } catch (error) {
            console.error('Error saving card:', error)
            alert('Failed to save card')
        }
    }

    async function handleDeleteCard(cardId: string) {
        if (!confirm('Are you sure you want to delete this card?')) return

        try {
            await supabase.from('cards').delete().eq('id', cardId)
            fetchDeckData()
        } catch (error) {
            console.error('Error deleting card:', error)
            alert('Failed to delete card')
        }
    }

    async function handleDeletePDF(pdfId: string) {
        if (!confirm('Are you sure? This will delete the PDF and ALL cards generated from it.')) return

        try {
            // Delete PDF (cascade will handle cards if configured, but let's be safe)
            await supabase.from('pdfs').delete().eq('id', pdfId)

            // Also manually delete cards just in case cascade isn't set up or fails
            // (Though the migration sets ON DELETE CASCADE)

            fetchDeckData()
        } catch (error) {
            console.error('Error deleting PDF:', error)
            alert('Failed to delete PDF')
        }
    }

    async function handlePDFUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingPDF(true)

        try {
            // 1. Create PDF record first
            const { data: pdfData, error: pdfError } = await supabase
                .from('pdfs')
                .insert({
                    deck_id: params.deckId,
                    name: file.name,
                    user_id: user?.id
                })
                .select()
                .single()

            if (pdfError) throw pdfError

            // 2. Upload PDF and generate cards
            const formData = new FormData()
            formData.append('file', file)
            formData.append('count', cardCount.toString())
            formData.append('style', cardStyle)

            const res = await fetch('/api/generate', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) throw new Error('Failed to generate cards')

            const data = await res.json()
            const newCards = data.cards

            // 3. Save cards to this deck with source_pdf_id
            const cardsToInsert = newCards.map((card: any) => ({
                deck_id: params.deckId,
                front: card.front,
                back: card.back,
                source_pdf_id: pdfData.id
            }))

            await supabase.from('cards').insert(cardsToInsert)

            fetchDeckData()
            alert(`Added ${newCards.length} new cards from ${file.name}!`)
        } catch (error) {
            console.error('Error uploading PDF:', error)
            alert('Failed to generate cards from PDF')
        } finally {
            setUploadingPDF(false)
            // Reset input
            e.target.value = ''
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>
    if (!deck) return <div className="flex h-screen items-center justify-center">Deck not found</div>

    return (
        <div className="min-h-screen bg-[#F5F5F7] p-6 md:p-12 font-sans">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <Link href="/dashboard" className="inline-flex items-center text-gray-500 hover:text-black mb-8 transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        <span className="font-medium">Back to Dashboard</span>
                    </Link>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-start justify-between mb-2">
                            {editingName ? (
                                <div className="flex-1 mr-4">
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="text-4xl font-bold w-full border-b-2 border-blue-500 focus:outline-none bg-transparent pb-2"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                    />
                                    <div className="flex gap-3 mt-4">
                                        <Button onClick={handleSaveName}>Save</Button>
                                        <Button variant="outline" onClick={() => setEditingName(false)}>Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 group">
                                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{deck.name}</h1>
                                    <button
                                        onClick={() => setEditingName(true)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Edit className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
                            <span>Created on {new Date(deck.created_at).toLocaleDateString()}</span>
                            <span className="font-medium bg-gray-100 px-3 py-1 rounded-full">{cards.length} cards</span>
                        </div>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-10 items-center">
                    <Button
                        onClick={() => setModalOpen(true)}
                        className="h-12 px-6 rounded-xl bg-black hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Card
                    </Button>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <select
                            className="h-12 px-3 rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={cardStyle}
                            onChange={(e) => setCardStyle(e.target.value)}
                            disabled={uploadingPDF}
                        >
                            <option value="mixed">Mixed Style</option>
                            <option value="qa">Q&A Only</option>
                            <option value="cloze">Cloze (Fill-in)</option>
                        </select>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            className="h-12 w-20 px-3 rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={cardCount || ''}
                            onChange={(e) => {
                                const val = parseInt(e.target.value)
                                setCardCount(isNaN(val) ? 0 : val)
                            }}
                            disabled={uploadingPDF}
                            placeholder="Qty"
                        />
                    </div>

                    <label className="w-full md:w-auto">
                        <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={handlePDFUpload}
                            disabled={uploadingPDF}
                        />
                        <div className={`h-12 px-6 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-900 shadow-sm hover:shadow-md transition-all flex items-center justify-center cursor-pointer w-full md:w-auto ${uploadingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {uploadingPDF ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5 mr-2" />
                                    Add PDF
                                </>
                            )}
                        </div>
                    </label>

                    <div className="flex-1" />

                    <Link href={`/study/${params.deckId}?mode=practice`} className="w-full md:w-auto">
                        <Button className="h-12 px-8 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all w-full md:w-auto font-medium text-lg">
                            <GraduationCap className="w-6 h-6 mr-2" />
                            Practice All
                        </Button>
                    </Link>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: PDFs */}
                    <div className="lg:col-span-1 space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-gray-500" />
                            Sources
                        </h2>

                        {pdfs.length === 0 ? (
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center text-gray-400 text-sm">
                                No PDFs uploaded yet
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pdfs.map(pdf => (
                                    <div key={pdf.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-100 transition-colors">
                                        <div className="flex items-center overflow-hidden">
                                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 text-red-500">
                                                <File className="w-5 h-5" />
                                            </div>
                                            <div className="truncate">
                                                <div className="font-medium text-gray-900 truncate text-sm" title={pdf.name}>{pdf.name}</div>
                                                <div className="text-xs text-gray-500">{new Date(pdf.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeletePDF(pdf.id)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete PDF and its cards"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Cards */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold text-gray-900">Cards ({cards.length})</h2>

                        {cards.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                    <Plus className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No cards yet</h3>
                                <p className="text-gray-500 mb-6 max-w-xs mx-auto">Add a card manually or upload a PDF to generate them automatically.</p>
                                <Button onClick={() => setModalOpen(true)}>Create First Card</Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cards.map((card) => {
                                    const sourcePdf = pdfs.find(p => p.id === card.source_pdf_id)

                                    return (
                                        <div key={card.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all group relative">
                                            {sourcePdf && (
                                                <div className="absolute top-4 right-14 text-xs font-medium px-2 py-1 bg-gray-50 text-gray-500 rounded-md flex items-center max-w-[150px] truncate">
                                                    <File className="w-3 h-3 mr-1 flex-shrink-0" />
                                                    <span className="truncate">{sourcePdf.name}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1 mr-4 space-y-4">
                                                    <div>
                                                        <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">Front</div>
                                                        <div className="text-lg text-gray-900 font-medium">
                                                            <MarkdownRenderer content={card.front} />
                                                        </div>
                                                    </div>
                                                    <div className="h-px bg-gray-50 w-full" />
                                                    <div>
                                                        <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">Back</div>
                                                        <div className="text-gray-600 leading-relaxed">
                                                            <MarkdownRenderer content={card.back} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4">
                                                    <button
                                                        onClick={() => {
                                                            setEditingCard(card)
                                                            setModalOpen(true)
                                                        }}
                                                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-gray-400 hover:text-blue-600"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCard(card.id)}
                                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CardModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false)
                    setEditingCard(null)
                }}
                onSave={handleSaveCard}
                initialFront={editingCard?.front}
                initialBack={editingCard?.back}
                title={editingCard ? 'Edit Card' : 'Add Card'}
            />
        </div>
    )
}
