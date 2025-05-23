// test_mongo_connection.js
require('dotenv').config({ path: './.env.local' }); // Garante que as variáveis de ambiente de .env.local sejam carregadas

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('Erro: MONGODB_URI não está definida no .env.local!');
    process.exit(1); // Sai do script com erro
}

console.log('Tentando conectar ao MongoDB com a URI:', uri);

async function testConnection() {
    let client;
    try {
        client = new MongoClient(uri);
        await client.connect();
        console.log('Sucesso: Conectado ao MongoDB!');

        const db = client.db('rankingdb'); // Tente acessar o DB
        console.log('Sucesso: Acessado o banco de dados "rankingdb".');

        // Opcional: Tentar uma operação para confirmar a conexão
        const collections = await db.listCollections().toArray();
        console.log('Coleções no banco de dados:', collections.map(c => c.name));

    } catch (error) {
        console.error('Erro ao conectar ou interagir com o MongoDB:');
        console.error(error); // Imprime o erro completo aqui!
    } finally {
        if (client) {
            await client.close();
            console.log('Conexão MongoDB fechada.');
        }
    }
}

testConnection();