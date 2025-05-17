'use client'
import { useEffect, useState } from 'react'

interface Score {
  _id?: string
  name: string
  score: number
}

export default function RankingTable() {
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ranking')
      .then(r => r.json())
      .then(setScores)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="mt-6 text-sm text-neutral-500">Carregando ranking…</p>
  if (!scores.length) return <p className="mt-6 text-sm">Nenhum score ainda.</p>

  return (
    <div className="mt-8 w-full max-w-lg overflow-x-auto rounded-lg border shadow">
      <table className="min-w-full divide-y">
        <thead className="bg-neutral-800">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold text-white">#</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-white">Jogador</th>
            <th className="px-4 py-2 text-right text-sm font-semibold text-white">Pontuação</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {scores.map((s, i) => (
            <tr
              key={s._id ?? i}
              className={i % 2 ? 'bg-neutral-50' : 'bg-white'}
            >
              <td className="px-4 py-2 text-sm">{i + 1}</td>
              <td className="px-4 py-2 text-sm">{s.name}</td>
              <td className="px-4 py-2 text-right text-sm font-medium">
                {s.score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
