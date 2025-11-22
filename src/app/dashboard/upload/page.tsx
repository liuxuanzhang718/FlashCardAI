'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, FileText, Plus, Layers } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

export default function UploadPage() {
    const { user } = useAuth()
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState('')
    const [decks, setDecks] = useState<any[]>([])
    const [selectedDeckId, setSelectedDeckId] = useState<string>('new')
    const [newDeckName, setNewDeckName] = useState('')
    const router = useRouter()

    useEffect(() => {
        if (user) {
            fetchDecks()
        }
    }, [user])

    const fetchDecks = async () => {
        const { data } = await supabase.from('decks').select('*').order('created_at', { ascending: false })
        if (data) setDecks(data)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            // Auto-fill new deck name if empty
            if (!newDeckName) {
                setNewDeckName(e.target.files[0].name.replace('.pdf', ''))
            }
        }
    }

    const handleUpload = async () => {
        if (!file) return
        if (!user) {
            alert('Please log in first!')
            return
        }

        setLoading(true)
        setStatus('Parsing PDF and generating cards...')

        try {
            // 1. Parse PDF and Generate Cards via API
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/generate', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) throw new Error('Failed to generate cards')

            const data = await res.json()
            const cards = data.cards

            setStatus(`Generated ${cards.length} cards. Saving to database...`)

            let deckId = selectedDeckId

            // 2. Create Deck if "new" is selected
            if (selectedDeckId === 'new') {
                const { data: deck, error: deckError } = await supabase
                    .from('decks')
                    .insert({
                        user_id: user.id,
                        name: newDeckName || file.name.replace('.pdf', ''),
                    })
                    .select()
                    .single()

                if (deckError) throw deckError
                deckId = deck.id
            }

            // 3. Create Cards
            const cardsToInsert = cards.map((card: any) => ({
                deck_id: deckId,
                front: card.front,
                back: card.back,
            }))

            const { error: cardsError } = await supabase
                .from('cards')
                .insert(cardsToInsert)

            if (cardsError) throw cardsError

            setStatus('Done! Redirecting...')
            router.push('/dashboard')

        } catch (error: any) {
            console.error(error)
            setStatus(`Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <Upload className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Upload your PDF</h1>
                    <p className="text-gray-500">
                        We'll extract key concepts and create flashcards for you.
                    </p>
                </div>

                {/* Deck Selection */}
                <div className="mb-6 space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Target Deck</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setSelectedDeckId('new')}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${selectedDeckId === 'new' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                            <div className="flex items-center mb-2">
                                <Plus className="w-5 h-5 mr-2" />
                                <span className="font-semibold">New Deck</span>
                            </div>
                            <p className="text-xs opacity-70">Create a fresh deck from this PDF</p>
                        </button>
                        <button
                            onClick={() => setSelectedDeckId(decks.length > 0 ? decks[0].id : 'new')}
                            disabled={decks.length === 0}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${selectedDeckId !== 'new' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'} ${decks.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="flex items-center mb-2">
                                <Layers className="w-5 h-5 mr-2" />
                                <span className="font-semibold">Existing Deck</span>
                            </div>
                            <p className="text-xs opacity-70">Add cards to one of your {decks.length} decks</p>
                        </button>
                    </div>

                    {selectedDeckId === 'new' ? (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">New Deck Name</label>
                            <input
                                type="text"
                                value={newDeckName}
                                onChange={(e) => setNewDeckName(e.target.value)}
                                placeholder="e.g., Biology 101"
                                className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Select Deck</label>
                            <select
                                value={selectedDeckId}
                                onChange={(e) => setSelectedDeckId(e.target.value)}
                                className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                {decks.map((deck) => (
                                    <option key={deck.id} value={deck.id}>
                                        {deck.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 mb-8 transition-colors hover:border-blue-400 text-center">
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                        {file ? (
                            <div className="flex items-center text-blue-600">
                                <FileText className="w-6 h-6 mr-2" />
                                <span className="font-medium">{file.name}</span>
                            </div>
                        ) : (
                            <span className="text-gray-400">Click to select a PDF file</span>
                        )}
                    </label>
                </div>

                {status && (
                    <div className="mb-6 text-sm text-gray-600 animate-pulse text-center">
                        {status}
                    </div>
                )}

                <Button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="w-full h-12 text-lg"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...
                        </>
                    ) : (
                        'Generate Flashcards'
                    )}
                </Button>
            </div>
        </div>
    )
}
