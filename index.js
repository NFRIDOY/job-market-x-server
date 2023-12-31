const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();
const jwt = require("jsonwebtoken"); // npm install jsonwebtoken
const cookieParser = require("cookie-parser"); // npm install cookie-parser

// init
const app = express()
const port = process.env.PORT || 5000;

// Middleware
// app.use(cors());
app.use(cors({
    origin: ["https://job-market-x.web.app", "http://localhost:5173", "http://localhost:5174"],
    // origin: ["https://job-market-x.web.app"],
    credentials: true
}));
app.use(express.json());
// app.use(express.json());
app.use(cookieParser())

// Verify

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    const emailReq = req.query.email;

    console.log(token);
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized Access, No Token' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized Access' })
        }
        console.log("verifyToken: verify")
        console.log("decoded", decoded)
        req.user = decoded;
        // if (req.user.email === emailReq) {
        //     return res.status(403).send({ message: 'Forbiden Access' })
        // }

        next()
    })
}

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
        // client.connect();

        // Operations
        const database = client.db("JobMarketXDB");
        const jobsCollection = database.collection("Jobs")
        const bidCollection = database.collection("MyBids")

        // jwt
        app.post("/api/v1/jwt", async (req, res) => {
            try {
                const user = req.body;
                console.log(user)
                const token = await jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,
                    {
                        expiresIn: '1h'
                    }
                )

                console.log("token", token)


                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',

                })
                    .send({ message: 'true' })
            } catch (error) {
                console.log(error)
            }
        })

        // Logout 

        app.post('/api/v1/logout', async (req, res) => {
            const user = req.body;
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })

        // // Get user All Posted Jobs
        // app.get('/api/v1/allJobs', async (req, res) => {
        //     try {
        //         const queryEmail = req.query.email;
        //         const queryCat = req.query.cat;
        //         console.log(queryEmail)
        //         let query = {};
        //         if (req.query.email) {
        //             query = { email: { $ne: queryEmail }, category: queryCat };
        //             let result = await jobsCollection.find(query).toArray();
        //             res.send(result)
        //         }
        //         else {
        //             result = await jobsCollection.find(query).toArray();
        //             res.send(result)
        //         }
        //     } catch (error) {
        //         console.log("error On /api/v1/AllJobs")
        //         console.log(error)
        //     }
        // })

        app.get('/api/v1/allJobs', async (req, res) => {
            try {
                
                const queryCat = req.query.cat;
                console.log(queryCat)
                let query = {};
                if (queryCat) {
                    query = { category: queryCat };
                    let result = await jobsCollection.find(query).toArray();
                    res.send(result)
                }
                else {
                    result = await jobsCollection.find(query).toArray();
                    res.send(result)
                }
            } catch (error) {
                console.log("error On /api/v1/AllJobs")
                console.log(error)
            }
        })

        // // Get a Job Details Page // Dynamic route
        app.get('/api/v1/allJobs/:id', verifyToken, async (req, res) => {
            try {
                const id = req.params.id;
                // const queryEmail = req.query.email;
                // console.log(queryEmail)
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
                console.log("error On /api/v1/allJobs")
                console.log(error)
            }
        })

        // ADD PRODUCTS
        // http://localhost:5000/api/v1/addJobs
        app.post('/api/v1/addJobs', verifyToken, async (req, res) => {
            try {
                const newJob = req.body;
                // console.log(newJob)
                const result = await jobsCollection.insertOne(newJob);
                res.send(result)
            } catch (error) {
                console.log("error On /api/v1/addJobs")
                console.log(error)
            }
        })

        // Get user Posted Jobs
        // app.get('/api/v1/myPostedJobs', async (req, res) => {
        app.get('/api/v1/myPostedJobs', verifyToken, async (req, res) => {
            try {
                console.log(req.user)
                let query = {};

                const queryEmail = req.query.email;
                if (req.user.email !== queryEmail) {
                    return res.status(403).send({ message: 'Forbiden Access' })
                }
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
        app.get('/api/v1/myPostedJobs/:id', verifyToken, async (req, res) => {
            try {
                const id = req.params.id;
                // console.log(id)
                const queryEmail = req.query.email;
                // console.log(queryEmail)
                if (req.user.email !== queryEmail) {
                    return res.status(403).send({ message: 'Forbiden Access' })
                }
                let query = { _id: new ObjectId(id) };
                // if(req.query.email) {
                //     query = {email: queryEmail};
                //     let result = await jobsCollection.findOne(query).toArray();
                //     res.send(result)
                // }
                // else {
                result = await jobsCollection.findOne(query);
                res.send(result)
                // }
            } catch (error) {
                console.log("error On Get /api/v1/myPostedJobs")
                console.log(error)
            }
        })

        // put My Posted Job by ID
        app.put('/api/v1/myPostedJobs/:id', verifyToken, async (req, res) => {
            try {
                const id = req.params.id;
                const updateJob = req.body;
                // console.log(id)
                // console.log(updateJob)
                // const queryEmail = req.query.email;
                // console.log(queryEmail)
                // let query = { _id: new ObjectId(id) };

                const filter = { _id: new ObjectId(id) };
                const options = { upsert: true };
                job = {
                    $set: {
                        jobTitle: updateJob.jobTitle,
                        deadline: updateJob.deadline,
                        description: updateJob.description,
                        category: updateJob.category,
                        minPrice: updateJob.minPrice,
                        maxPrice: updateJob.maxPrice,
                    },
                };

                result = await jobsCollection.updateOne(filter, job, options);
                res.send(result)
            } catch (error) {
                console.log("error On Update/PUT /api/v1/myPostedJobs")
                console.log(error)
            }
        })


        // Delete My Posted Job by ID
        app.delete('/api/v1/myPostedJobs/:id', verifyToken, async (req, res) => {
            try {
                const id = req.params.id;
                console.log(id)
                // const queryEmail = req.query.email;
                // console.log(queryEmail)
                const queryEmail = req.query.email;
                if (req.user.email !== queryEmail) {
                    return res.status(403).send({ message: 'Forbiden Access' })
                }
                let query = { _id: new ObjectId(id) };

                result = await jobsCollection.deleteOne(query);
                res.send(result)
            } catch (error) {
                console.log("error On Delete /api/v1/myPostedJobs")
                console.log(error)
            }
        })

        // http://localhost:5000/api/v1/addBid
        // app.post('/api/v1/myBids', verifyToken, async (req, res) => {
        app.post('/api/v1/myBids', verifyToken, async (req, res) => {
            try {
                const newBid = req.body;
                console.log(req.user)
                const queryEmail = req.query.email;
                // console.log(queryEmail)
                // if (req.user.email !== queryEmail) {
                //     return res.status(403).send({ message: 'Forbiden Access' })
                // }
                const result = await bidCollection.insertOne(newBid);
                res.send(result)
            } catch (error) {
                console.log("error On Post /api/v1/myBids")
                console.log(error)
            }
        })

        // http://localhost:5000/api/v1/myBid
        // app.get('/api/v1/myBids', verifyToken, async (req, res) => {
        app.get('/api/v1/myBids', verifyToken, async (req, res) => {
            try {
                const queryBidEmail = req.query.email;
                const isReq = req.query?.isReq;
                // console.log(isReq)
                // console.log(true)
                let query = {};
                if (req.query.email && isReq != 1) {
                    query = { emailBidForm: queryBidEmail };
                    let result = await bidCollection.find(query).toArray();
                    res.send(result)
                }
                else if (req.query.email && isReq == 1) {
                    query = { emailOwnerForm: queryBidEmail };
                    result = await bidCollection.find(query).toArray();
                    res.send(result)
                }
            } catch (error) {
                console.log("error On Get /api/v1/myBids")
                console.log(error)
            }
        })

        app.put('/api/v1/myBids/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const { status } = req.body;
                // const updateStatus = req.body;
                // console.log(status)
                // console.log(id)
                // const queryEmail = req.query.email;
                // console.log(queryEmail)
                // let query = { _id: new ObjectId(id) };

                const filter = { _id: new ObjectId(id) };
                const options = { upsert: true };
                job = {
                    $set: {
                        status: status,
                    }
                };

                result = await bidCollection.updateOne(filter, job, options);
                res.send(result)
            } catch (error) {
                console.log("error On Update/PUT /api/v1/myBids/:id")
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