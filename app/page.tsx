'use client'

import { useState } from 'react'
import NamePrompt from '@/components/name'         // NamePrompt.tsx
import TetrisGame from '@/components/tetris-game'  // seu jogo
import RankingTable from '@/components/ranking'    // RankingTable.tsx

export default function Home() {
  const [playerName, setPlayerName] = useState<string | null>(null)

  // quando o jogo terminar chame essa função para gravar score
  async function handleGameOver(score: number) {
    if (!playerName) return
    await fetch('/api/ranking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName, score }),
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-gradient-to-b from-blue-800 to-blue-950 p-4">
      {/* 1 ▸ modal de nome (bloqueia a tela até definir) */}
      {!playerName && <NamePrompt onSubmit={setPlayerName} />}

      {/* 2 ▸ jogo + ranking ficam visíveis depois que o nome é definido */}
      {playerName && (
        <>
          <TetrisGame playerName={playerName} onGameOver={handleGameOver} />
          <RankingTable />
        </>
      )}

      {!playerName && (
        <div className="p-4">
          <h1 className="text-3xl font-bold text-white">Hello JSX</h1>
        </div>
      )}
    </main>
  )
}
