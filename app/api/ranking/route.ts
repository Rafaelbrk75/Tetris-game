import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb'; // Importa clientPromise

export async function GET() {
  try {
    const client = await clientPromise; // Espera a Promise resolver
    const db = client.db('rankingdb'); // Obtém o banco de dados
    const scores = await db.collection('scores').find().sort({ score: -1 }).limit(10).toArray();
    return NextResponse.json(scores);
  } catch (error) {
    console.error(error) // Adicione esta linha para ver o erro no terminal
    return NextResponse.json({ error: 'Erro ao buscar ranking' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, score } = await req.json();
    if (!name || typeof score !== 'number') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const client = await clientPromise; // Espera a Promise resolver
    const db = client.db('rankingdb'); // Obtém o banco de dados
    await db.collection('scores').insertOne({ name, score });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao salvar score' }, { status: 500 });
  }
}

// Removido bloco mongoose.connect desnecessário, pois clientPromise já gerencia a conexão.

