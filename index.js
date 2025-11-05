const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const admin = require("firebase-admin");
const port = process.env.PORT || 3000;
// console.log(process.env)


const serviceAccount = require("./smart-deals-firebase-admin-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});




// middleware
app.use(cors());
app.use(express.json());


// const verifyFireBaseToken = async (req, res, next) => {
//   console.log('hello there form here')
//     const authorization = req.headers.authorization;
    // if (!authorization) {
    //     return res.status(401).send({ message: 'unauthorized access' })
    // }
    // const token = authorization.split(' ')[1];
    
//     try {
//         const decoded = await admin.auth().verifyIdToken(token);
//         console.log('inside token', decoded)
//         req.token_email = decoded.email;
        // next();
//     }
//     catch (error) {
//         return res.status(401).send({ message: 'unauthorized access' })
//     }
// }



const verifyFireBaseToken = async (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).send({ message: 'unauthorized access one' })
    }
    const token = authorization.split(' ')[1];
    console.log(token);
    if(!token){
      return res.status(401).send({message: 'unauthorized access two'})
    }
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        console.log('after token validation', decoded);
        req.token_email=decoded.email;
        next();

    }
    catch (error) {
      console.log(error);
        return res.status(401).send({ message: 'unauthorized access three' })
    }
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qwnp7az.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


app.get('/', (req, res) => {
  res.send('Smart Server is running')
})

async function run() {
  try {
    
    await client.connect();
    
    const db = client.db("smart_db");
    const productsCollection = db.collection('products');
    const bidsCollection = db.collection('bids');
    const usersCollection = db.collection('users');


// USERS API
    app.post('/users', async (req, res) => {
            const newUser = req.body;
            // const email = req.body.email;
            // const query = { email: email }npm 
            // const existingUser = await usersCollection.findOne(query);
            
            // if (existingUser) {
            //     res.send({message: 'user already exits. do not need to insert again'})
            // }
            // else {
                const result = await usersCollection.insertOne(newUser);
                res.send(result);
            // }
        })

// PRODUCTS API
    app.get('/products', async (req, res) => {
            // const projectFields = { title: 1, price_min: 1, price_max: 1, image: 1 }
            // const cursor = productsCollection.find().sort({ price_min: -1 }).skip(2).limit(2).project(projectFields);

            console.log(req.query)
            const email = req.query.email;
            const query = {}
            if (email) {
                query.email = email;
            }

            const cursor = productsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
    });


    app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await productsCollection.findOne(query);
            res.send(result);
    })



    app.post('/products', verifyFireBaseToken, async(req, res) => {
      console.log('headers in the post ', req.headers)
        const newProduct = req.body;
        const result = await productsCollection.insertOne(newProduct);
        res.send(result);
    })


    app.get('/latest-products', async (req, res) => {
            const cursor = productsCollection.find().sort({ created_at: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
      })

    app.patch('/products/:id', async (req, res) => {
            const id = req.params.id;
            const updatedProduct = req.body;
            const query = { _id: new ObjectId(id) }
            const update = {
                $set: {
                    name: updatedProduct.name,
                    price: updatedProduct.price
                }
            }

            const result = await productCollection.updateOne(query, update)
            res.send(result)
        })


    app.delete('/products/:id', async(req, res) => {
        const id = req.params.id;
        const quary = {_id: new ObjectId(id)};
        const result = await productCollection.deleteOne(quary);
        res.send(result);
    })


    // bids related apis
     app.get('/bids', verifyFireBaseToken, async (req, res) => {
      // console.log('headers', req.headers)
            const email = req.query.email;
            const query = {};
            if (email) {
                query.buyer_email = email;
                 if(email !== req.token_email){
                    return res.status(403).send({message: 'forbidden access'})
                }
            }

            const cursor = bidsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
    })


    app.get('/products/bids/:productId', verifyFireBaseToken, async (req, res) => {
            const productId = req.params.productId;
            const query = { product: productId }
            const cursor = bidsCollection.find(query).sort({ bid_price: -1 })
            const result = await cursor.toArray();
            res.send(result);
    })


    // app.post('/bids', async (req, res) => {

    //         const query = {};
    //         if(query.email){
    //           query.buyer_email = email;
    //         }

    //         const cursor = bidsCollection.find();
    //         const result = await cursor.toArray();
    //         res.send(result);
    // })

    app.post('/bids', async (req, res) => {
            const newBid = req.body;
            const result = await bidsCollection.insertOne(newBid);
            res.send(result);
    })

    app.delete('/bids/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bidsCollection.deleteOne(query);
            res.send(result);
    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Smart Server is running now on port ${port}`)
});

