const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5010;

app.use(cors());
app.use(express.json());

const varifyJwt = (req, res, next)=>{
  const authorization = req.header.authorization;
  if (!authorization) {
    res.status(401).send({erro: true, message: "unauthorized access"})
  }

  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    if(err){
      res.status(401).send({ error: true, message: "unauthorized access" });
    }

    req.decoded = decoded;
    next();
  });
};

const { MongoClient, ServerApiVersion } = require('mongodb');


const uri = "mongodb://0.0.0.0:27017/";
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qawsvmr.mongodb.net/?retryWrites=true&w=majority;`

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
    // write code here
    await client.connect();

    const userCollection = client.db('summerCampdb').collection('user');
    const instructorCollection = client.db("summerCampdb").collection("instructors");

    app.post("/jwt", (req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: "1h"
      });
      res.send({token});
    })

    // user data store in the database
    app.post('/users', async(req, res)=>{
      const user = req.body;
      const query = {email: user.email}
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })

// INSTRUCTOR data
    app.get("/instructor", async(req, res)=>{
      const result = await instructorCollection.find().toArray();
      res.send(result);
    })

    app.get("/", (req, res) => {
      res.send("Summer Camp Server is running..");
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Summer Camp is running on port ${port}`);
});
