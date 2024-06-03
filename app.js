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

app.get('/', (req, res) => {
    res.send('Welcome to the Vehicle Search API');
});

app.post('/insert', async (req, res) => {
    let logs = '';

    function log(message) {
        logs += message + '\n';
    }

    try {
        log('Inside insert');
        console.log('Inside insert:');
        const db = await connectToDatabase();
        const collection = db.collection('values');  // Change this to your collection name
        
        // Check if document with provided name exists
        const existingDocument = await collection.findOne({ name: req.body.name });
        console.log('Existing document:', existingDocument);
        log(`Existing document: ${JSON.stringify(existingDocument)}`);
        if (existingDocument) {
            // If document exists, return its value
            console.log('Match found');
            log('Match found');
            res.send(`Value for name ${req.body.name}: ${JSON.stringify(existingDocument.value)}`);
        } else {
            // If document does not exist, fetch data from external API
            console.log('req.body.name:', req.body.name);
            log(`req.body.name: ${req.body.name}`);
            const nameEncoded = encodeURIComponent(req.body.name);
            console.log('nameEncoded:', nameEncoded);
            log(`nameEncoded: ${nameEncoded}`);
            // const url = `https://www.carinfo.app/_next/data/Ss3I2sprpgaCgbsHipfXw/rc-details/${nameEncoded}.json?rc=${nameEncoded}`;
            const url = 'https://www.carinfo.app/_next/data/Ss3I2sprpgaCgbsHipfXw/rc-details/DL10CE1429.json?rc=DL10CE1429'
            // const url ='https://official-joke-api.appspot.com/random_joke';
            console.log('Requesting data from URL:', url);
            log(`Requesting data from URL: ${url}`);

            try {
                const response = await axios.get(url, {
                    headers: {
                        'Content-Type':'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                        'Accept': '*/*',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Connection':'keep-alive',
                        'authority':'www.carinfo.app',
                        'Host': 'www.carinfo.app',
                        'method':'GET',
                        'Cookie':'city=Delhi; cityId=10084; session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..Nq6akCwbUBnmIB9B.WO4ge-qPV_qYYwHex7rQaeohVNP2RHuJl9COc1ZUkic3Bp_Jx72ESGVuGajB2QJAE9aQL4YLSkV2c6hwF820QPMEusv1Zx6v82EiKRCqZk8db_BQFfbS3aDtp_OqySK9CZUwuz48ZfVQr3iJRnVOP8aNOgSLIhTGwFYHK00gD7MqZQ6Yu8Eiid06QilRAZUsIzWWxK18-s4jSpJT4pz5MHxBxySOMWSJPOTtmQzIw-RhbzgiMqvgW3RihQDLp1gjIa7k3mwgb4S_6SFBojYN6_fcfazuaoPT2sjO6cA1Z_6W-iTDxlZJnGFkISC76ET518koMIQs6wMT8ICcHVd_pislLmS_30mAHBedlOrpLIHFsQrjb266sf0.FiKnvxenwnP6RvHN_7Q7gA'
                    }
                });
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
        log(`Error processing request: ${error}`);
        console.error(logs);
        res.status(500).send('Error processing request: ' + error.message);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
