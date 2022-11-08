const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000

//middleware

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_URL}/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).send({message: 'unauthorized access'});
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'Forbidden access'});
        }
        req.decoded = decoded;
        next();
    })
}


async function run(){
    try{
        const serviceCollection = client.db('serviceReview').collection('services');
        const reviewCollection = client.db('serviceReview').collection('reviews');
        
        // service releted apis
        app.post('/getToken', (req, res) =>{
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d'})
            res.send({token})
        })

        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        app.post('/services', verifyJWT, async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(order);
            res.send(result);
        });

        // review releted apis
        app.get('/reviewsForService/:serviceid', async (req, res) => {
            const serviceId = req.params.serviceid;
            query = { serviceId: ObjectId(serviceId) };
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        app.get('/reviews', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            
            if(decoded.email !== req.query.email){
                res.status(403).send({message: 'unauthorized access'})
            }

            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        app.post('/reviews', verifyJWT, async (req, res) => {
            const order = req.body;
            const review = await reviewCollection.insertOne(order);
            res.send(review);
        });

        app.patch('/reviews/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const status = req.body.status
            const query = { _id: ObjectId(id) }
            const updatedDoc = {
                $set:{
                    status: status
                }
            }
            const review = await reviewCollection.updateOne(query, updatedDoc);
            res.send(review);
        })

        app.delete('/reviews/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const review = await reviewCollection.deleteOne(query);
            res.send(review);
        })

    }
    finally{

    }
}

run().catch(err => console.error(err));


app.get('/', (req,res)=>{
    res.send("review server is running..");
})

app.listen(port,()=>{
    console.log(`running on: ${port}`);
})