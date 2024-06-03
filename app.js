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
    let logs = '';

    function log(message) {
        logs += message + '\n';
    }

    try {
        log('inside insert');
        console.log('inside insert:');
        const db = await connectToDatabase();
        const collection = db.collection('values');  // Change this to your collection name
        
        // Check if document with provided name exists
        const existingDocument = await collection.findOne({ name: req.body.name });
        console.log('existingDocument:', existingDocument);
        log(`existingDocument: ${JSON.stringify(existingDocument)}`);
        if (existingDocument) {
            // If document exists, return its value
            console.log('match found');
            log('match found');
            res.send(`Value for name ${req.body.name}: ${JSON.stringify(existingDocument.value)}`);
        } else {
            // If document does not exist, fetch data from external API
            console.log('req.body.name:', req.body.name);
            log(`req.body.name: ${req.body.name}`);
            const nameEncoded = encodeURIComponent(req.body.name);
            console.log('nameEncoded:', nameEncoded);
            log(`nameEncoded: ${nameEncoded}`);
            const url = `https://www.carinfo.app/_next/data/Ss3I2sprpgaCgbsHipfXw/rc-details/${nameEncoded}.json?rc=${nameEncoded}`;
            console.log('Requesting data from URL:', url);
            log(`Requesting data from URL: ${url}`);

            try {
                const response = await axios.get(url);
                console.log('response:', response.data);
                log(`response: ${JSON.stringify(response.data)}`);
                const responseData = response.data;
                console.log('responseData:', responseData);
                log(`responseData: ${JSON.stringify(responseData)}`);
                // Construct the response
                const responseObject = {
                    name: req.body.name,
                    value: responseData
                };

                // Insert the document into the database
                await collection.insertOne(responseObject);

                // Return the response
                res.json(responseObject);
            } catch (apiError) {
                log(`Error fetching data from external API: ${apiError}`);
                log('API Error Response:', apiError.response ? JSON.stringify(apiError.response.data) : 'No response data');
                console.error(logs);
                res.status(apiError.response ? apiError.response.status : 500).send('Error fetching data from external API: ' + apiError.message);
            }
        }
    } catch (error) {
        log(`Error processing request: ${logs}`);
        console.error(logs);
        res.status(500).send('Error processing request: ' + error.message);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
