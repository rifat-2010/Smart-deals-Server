const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;


// middleware
app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://smartdbUser:CeFr4lRnkP5ONvN6@cluster0.qwnp7az.mongodb.net/?appName=Cluster0";

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
    const productsCollection = db.collection('products')

    app.get('/products', async (req, res) => {
            // const projectFields = { title: 1, price_min: 1, price_max: 1, image: 1 }
            const cursor = productsCollection.find()
            // .sort({ price_min: -1 }).skip(2).limit(2).project(projectFields);

            // console.log(req.query)
            // const email = req.query.email;
            // const query = {}
            // if (email) {
            //     query.email = email;
            // }

            // const cursor = productsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
    });


    app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await productsCollection.findOne(query);
            res.send(result);
    })


    app.post('/products', async(req, res) => {
        const newProduct = req.body;
        const result = await productsCollection.insertOne(newProduct);
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

