const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();

// init
const app = express()
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    // credentials: true
}));
app.use(express.json());

// MongoDB
// console.log(process.env.DB_USER)
// console.log(process.env.DB_PASS)
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hlezmce.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        client.connect();

        // Operations
        const database = client.db("JobMarketXDB");
        const jobsCollection = database.collection("Jobs")
        const bidCollection = database.collection("MyBids")

        // // Get user All Posted Jobs
        app.get('/api/v1/allJobs', async (req, res) => {
            try {
                const queryEmail = req.query.email;
                console.log(queryEmail)
                let query = {};
                if (req.query.email) {
                    query = { email: { $ne: queryEmail } };
                    let result = await jobsCollection.find(query).toArray();
                    res.send(result)
                }
                else {
                    result = await jobsCollection.find(query).toArray();
                    res.send(result)
                }
            } catch (error) {
                console.log("error On /api/v1/myPostedJobs")
                console.log(error)
            }
        })

        // // Get a Job Details Page // Dynamic route
        app.get('/api/v1/allJobs/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const queryEmail = req.query.email;
                console.log(queryEmail)
                let query = { _id: new ObjectId(id) };
                // if (req.query.email) {
                //     query = { email: {$ne: queryEmail} };
                //     let result = await jobsCollection.find(query).toArray();
                //     res.send(result)
                // }
                // else {
                result = await jobsCollection.findOne(query);
                res.send(result)
                // }
            } catch (error) {
                console.log("error On /api/v1/myPostedJobs")
                console.log(error)
            }
        })

        // ADD PRODUCTS
        // http://localhost:5000/api/v1/addJobs
        app.post('/api/v1/addJobs', async (req, res) => {
            try {
                const newJob = req.body;
                console.log(newJob)
                const result = await jobsCollection.insertOne(newJob);
                res.send(result)
            } catch (error) {
                console.log("error On /api/v1/addJobs")
                console.log(error)
            }
        })

        // Get user Posted Jobs
        app.get('/api/v1/myPostedJobs', async (req, res) => {
            try {
                const queryEmail = req.query.email;
                // console.log(queryEmail)
                let query = {};
                if (req.query.email) {
                    query = { email: queryEmail };
                    let result = await jobsCollection.find(query).toArray();
                    res.send(result)
                }
                else {
                    result = await jobsCollection.find(query).toArray();
                    res.send(result)
                }
            } catch (error) {
                console.log("error On /api/v1/myPostedJobs")
                console.log(error)
            }
        })
        // Find Update Job by ID
        app.get('/api/v1/myPostedJobs/:id', async (req, res) => {
            try {
                const id = req.params.id;
                console.log(id)
                // const queryEmail = req.query.email;
                // console.log(queryEmail)
                let query = { _id: new ObjectId(id) };
                // if(req.query.email) {
                //     query = {email: queryEmail};
                //     let result = await jobsCollection.findOne(query).toArray();
                //     res.send(result)
                // }
                // else {
                result = await jobsCollection.findOne(query).toArray();
                res.send(result)
                // }
            } catch (error) {
                console.log("error On /api/v1/myPostedJobs")
                console.log(error)
            }
        })

        // http://localhost:5000/api/v1/addBid
        app.post('/api/v1/myBids', async (req, res) => {
            try {
                const newBid = req.body;
                // console.log(newBid)
                const result = await bidCollection.insertOne(newBid);
                res.send(result)
            } catch (error) {
                console.log("error On /api/v1/addJobs")
                console.log(error)
            }
        })

        // http://localhost:5000/api/v1/myBid
        app.get('/api/v1/myBids', async (req, res) => {
            try {
                const queryBidEmail = req.query.email;
                // console.log(queryEmail)
                let query = {};
                if (req.query.email) {
                    query = { emailEmpForm: queryBidEmail };
                    let result = await bidCollection.find(query).toArray();
                    res.send(result)
                }
                else {
                    result = await bidCollection.find(query).toArray();
                    res.send(result)
                }
            } catch (error) {
                console.log("error On /api/v1/addBid")
                console.log(error)
            }
        })











        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send(`Job Market X Server is listening on port ${port}!`)
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`)
})