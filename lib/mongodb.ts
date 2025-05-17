import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!; // Mantive o "!" pois você parece ter certeza que a variável está definida
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

if (!uri) {
  throw new Error('Por favor defina a variável de ambiente MONGODB_URI');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR.
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped Promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
