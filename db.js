import { MongoClient, ServerApiVersion } from 'mongodb';

const username = encodeURIComponent('admin');
const password = encodeURIComponent('OchThNEvwWKkqn1H');

const uri = `mongodb+srv://${username}:${password}@tennisclub.lyfhec2.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

var conn;

try {
    conn = await client.connect();

    console.log('Pinged your deployment. You successfully connected to MongoDB!');
} catch(error) {
    console.error('Could not connect:', error);

    await client.close();
}

var db = conn.db('club');

try {
    db.command({ ping: 1 });
} catch(error) {
    console.error('Could not connect:', error);

    await client.close();
}

export default db;