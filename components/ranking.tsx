// app/ranking/RankingTable.tsx (ou onde quer que seu RankingTable esteja)
'use client'
import { useEffect, useState } from 'react'

interface Score {
  _id?: string
  name: string
  score: number
}

export default function RankingTable({ refreshTrigger }: { refreshTrigger: number }) {
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)

  console.log('RankingTable: Componente montado'); // LOG 1

  useEffect(() => {
    console.log('RankingTable: useEffect disparado, buscando ranking...'); // LOG 2
    fetch('/api/ranking')
      .then(r => {
        console.log('RankingTable: Resposta do fetch recebida, status:', r.status); // LOG 3
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then(data => {
        console.log('RankingTable: Dados recebidos da API:', data); // LOG 4 - CRUCIAL
        setScores(data);
      })
      .catch(error => {
        console.error('RankingTable: Erro ao buscar ranking:', error); // LOG 5
        // Você pode querer exibir uma mensagem de erro na UI aqui
      })
      .finally(() => {
        console.log('RankingTable: Operação de fetch finalizada.'); // LOG 6
        setLoading(false);
      })
  }, []) // O array de dependências vazio [] significa que este useEffect roda apenas uma vez, na montagem do componente.

  console.log('RankingTable: Estado atual - carregando:', loading, 'Tamanho dos scores:', scores.length); // LOG 7

  if (loading) return <p className="mt-6 text-sm text-neutral-500">Carregando ranking…</p>
 // if (!scores.length && !loading) return <p className="mt-6 text-sm">Nenhum score ainda.</p>

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
              key={s._id ?? i} // Usar s._id é melhor se _id vier do MongoDB
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
