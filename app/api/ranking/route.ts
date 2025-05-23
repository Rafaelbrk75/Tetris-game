import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic'; // Mantenha isso para desabilitar o cache do Next.js

export async function GET() {
  console.log('GET /api/ranking request received');
  try {
    const client = await clientPromise;
    console.log('MongoDB client obtained for GET');
    const db = client.db('rankingdb');
    console.log('Database rankingdb accessed for GET');

    // NOVO: Adicione readConcern: 'majority' ao find()
    const scores = await db.collection('scores')
      .find({}, { readConcern: 'majority' }) // <--- Adicione isto aqui
      .sort({ score: -1 })
      .limit(10)
      .toArray();

    console.log('Scores fetched for GET:', scores.length);
    return NextResponse.json(scores);
  } catch (error: any) {
    console.error('Error in GET /api/ranking:', error);
    return NextResponse.json({ error: 'Erro ao buscar ranking' }, { status: 500 });
  }
}

// Seu POST handler permanece o mesmo
export async function POST(req: Request) {
  console.log('POST /api/ranking request received');
  try {
    const { name, score } = await req.json();
    console.log('Request body parsed for POST:', { name, score });

    if (!name || typeof score !== 'number') {
      console.warn('Invalid data received for POST:', { name, score });
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const client = await clientPromise;
    console.log('MongoDB client obtained for POST');
    const db = client.db('rankingdb');
    console.log('Database rankingdb accessed for POST');
    // A inserção provavelmente já está usando writeConcern: 'majority' por padrão via Atlas
    await db.collection('scores').insertOne({ name, score });
    console.log('Score inserted for POST:', { name, score });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/ranking:', error);
    return NextResponse.json({ error: 'Erro ao salvar score' }, { status: 500 });
  }
}