// app/page.tsx
'use client'

import { useState } from 'react'
import NamePrompt from '@/components/name'         // Verifique se o caminho e o nome são exatamente estes
import TetrisGame from '@/components/tetris-game'   // Verifique se o caminho e o nome são exatamente estes
import RankingTable from '@/components/ranking'     // Verifique se o caminho e o nome são exatamente estes

export default function Home() {
  const [playerName, setPlayerName] = useState<string | null>(null)
  // NOVO ESTADO: Use um key para forçar a remontagem do RankingTable
  const [rankingTableKey, setRankingTableKey] = useState(0); 

  // Função para lidar com a definição do nome (com log)
  const handleSetPlayerName = (name: string) => {
    console.log('app/page.tsx: setPlayerName acionado com:', name);
    setPlayerName(name);
    // Opcional: Você pode querer forçar a remontagem do ranking aqui também,
    // caso já existam scores e você queira vê-los imediatamente após digitar o nome.
    // setRankingTableKey(prev => prev + 1); 
  };

  async function handleGameOver(score: number) {
    if (!playerName) return
    try {
      const response = await fetch('/api/ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, score }),
      })

      if (response.ok) {
        console.log('Score enviado com sucesso!');
        // NOVO: Altere a key para forçar a remontagem do RankingTable
        setRankingTableKey(prev => prev + 1); 
      } else {
        const errorData = await response.json();
        console.error('Erro ao enviar score:', errorData);
      }
    } catch (error) {
      console.error('Erro de rede ao enviar score:', error);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-gradient-to-b from-blue-800 to-blue-950 p-4">
      {/* 1 ▸ modal de nome (bloqueia a tela até definir) */}
      {!playerName && <NamePrompt onSubmit={handleSetPlayerName} />} 

      {/* 2 ▸ jogo + ranking ficam visíveis depois que o nome é definido */}
      {playerName && (
        <>
          <TetrisGame playerName={playerName} onGameOver={handleGameOver} />
          <section className="mt-8">
            <h2 className="text-2xl font-bold mb-4 text-center text-white">Ranking de Jogadores</h2>
            <RankingTable key={rankingTableKey} refreshTrigger={rankingTableKey} />
          </section>
        </>
      )}
    </main>
  )
}