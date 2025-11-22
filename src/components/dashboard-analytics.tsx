'use client'

import { useMemo } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts'
import { Brain, Clock, Trophy, TrendingUp } from 'lucide-react'

interface AnalyticsProps {
    cards: any[]
}

export function DashboardAnalytics({ cards }: AnalyticsProps) {
    const stats = useMemo(() => {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const nextWeek = new Date(today)
        nextWeek.setDate(nextWeek.getDate() + 7)

        let newCards = 0
        let learning = 0
        let mature = 0
        let dueToday = 0

        // Initialize next 7 days map
        const next7Days = new Map<string, number>()
        for (let i = 0; i < 7; i++) {
            const d = new Date(today)
            d.setDate(d.getDate() + i)
            next7Days.set(d.toLocaleDateString('en-US', { weekday: 'short' }), 0)
        }

        cards.forEach(card => {
            // Mastery Status
            if (card.repetition === 0) {
                newCards++
            } else if (card.interval > 21) {
                mature++
            } else {
                learning++
            }

            // Due Date
            if (card.next_review) {
                const reviewDate = new Date(card.next_review)
                if (reviewDate <= now) {
                    dueToday++
                }

                // For the chart, we group by day
                // If it's overdue, we count it as "Today" (or just ignore for the future forecast? 
                // Usually forecast shows what is COMING, but overdue is important too.
                // Let's just show upcoming scheduled reviews for the chart to keep it clean)
                if (reviewDate >= today && reviewDate < nextWeek) {
                    const dayName = reviewDate.toLocaleDateString('en-US', { weekday: 'short' })
                    next7Days.set(dayName, (next7Days.get(dayName) || 0) + 1)
                }
            }
        })

        const forecastData = Array.from(next7Days.entries()).map(([name, count]) => ({
            name,
            count
        }))

        const masteryData = [
            { name: 'New', value: newCards, color: '#94a3b8' }, // Slate 400
            { name: 'Learning', value: learning, color: '#60a5fa' }, // Blue 400
            { name: 'Mature', value: mature, color: '#4ade80' }, // Green 400
        ].filter(d => d.value > 0)

        return {
            total: cards.length,
            dueToday,
            mature,
            learning,
            newCards,
            masteryData,
            forecastData
        }
    }, [cards])

    if (cards.length === 0) return null

    return (
        <div className="space-y-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Progress Overview</h2>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Cards"
                    value={stats.total}
                    icon={<Brain className="w-5 h-5 text-indigo-500" />}
                    bg="bg-indigo-50"
                />
                <StatCard
                    title="Due Today"
                    value={stats.dueToday}
                    icon={<Clock className="w-5 h-5 text-orange-500" />}
                    bg="bg-orange-50"
                />
                <StatCard
                    title="Learning"
                    value={stats.learning}
                    icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
                    bg="bg-blue-50"
                />
                <StatCard
                    title="Mastered"
                    value={stats.mature}
                    icon={<Trophy className="w-5 h-5 text-green-500" />}
                    bg="bg-green-50"
                />
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Mastery Chart */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold mb-6 text-gray-800">Card Mastery</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.masteryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.masteryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Forecast Chart */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold mb-6 text-gray-800">Upcoming Reviews (7 Days)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.forecastData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon, bg }: { title: string, value: number, icon: React.ReactNode, bg: string }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${bg}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    )
}
