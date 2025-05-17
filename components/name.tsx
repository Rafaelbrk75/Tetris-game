'use client'
import { useState } from 'react'

interface Props {
  onSubmit: (playerName: string) => void
}
export default function NamePrompt({ onSubmit }: Props) {
  const [name, setName] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-center text-xl font-semibold">
          Qual é o seu nome?
        </h2>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Digite aqui..."
          className="mb-4 w-full rounded-md border px-3 py-2 outline-none focus:ring"
        />
        <button
          disabled={!name}
          onClick={() => onSubmit(name.trim())}
          className="w-full rounded-lg bg-neutral-800 px-4 py-2 font-medium text-white enabled:hover:bg-neutral-700 disabled:opacity-40"
        >
          Iniciar Jogo
        </button>
      </div>
    </div>
  )
}
