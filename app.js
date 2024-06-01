const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { MongoClient } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// MongoDB connection URI
const uri = process.env.MONGODB_URI || 'mongodb+srv://Tabisahmad1:hsibat12@cluster.id9ucfe.mongodb.net/myDatabase';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToDatabase() {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db();
}

app.post('/insert', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('values');  // Change this to your collection name
        
        // Check if document with provided name exists
        const existingDocument = await collection.findOne({ name: req.body.name });

        if (existingDocument) {
            // If document exists, return its value
            res.send(`Value for name ${req.body.name}: ${existingDocument.value}`);
        } else {
            // If document does not exist, fetch data from external API
            const response = await axios.get('https://favqs.com/api/qotd');
            const qotdResponse = response.data.quote.body;
            
            // Construct the response
            const responseObject = {
                name: req.body.name,
                value: qotdResponse
            };

            // Insert the document into the database
            await collection.insertOne(responseObject);

            // Return the response
            res.json(responseObject);
        }
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send('Error processing request: ' + error.message);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
