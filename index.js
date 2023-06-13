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

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


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
    const classCollection = client.db("summerCampdb").collection("class");
    const selectClassCollection = client.db("summerCampdb").collection("selectClass");

    app.post("/jwt", (req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: "1h"
      });
      res.send({token});
    })

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };


    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false });
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);

      if (user?.role === "admin") {
        const result = { admin: user?.role === "admin" };
        res.send(result);
      }else if(user?.role === "instructor"){
        const result = { instructor: user?.role === "instructor" };
        res.send(result);
      }else{
        const result = { student: true };
        res.send(result);
      }
    });

    
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

    app.get('/users', async(req, res)=>{
      console.log("users");
      const result = await userCollection.find().toArray();
      res.send(result);
    })

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "instructor",
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // selectClass 
    app.post("/selectClass", async(req, res)=>{
      const selectClass = req.body;
      const result = await selectClassCollection.insertOne(selectClass);
      res.send(result);
    })

    app.get("/selectClass", async(req, res)=>{
      const email = req.query.email;

      if(!email){
        res.send([]);
      }

      const query = {email: email}

      const result = await selectClassCollection.find(query).toArray();
      res.send(result);
    })

    app.delete("/selectClass/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await selectClassCollection.deleteOne(query);
      res.send(result);
    });

// INSTRUCTOR data
    app.get("/instructor", async(req, res)=>{
      const result = await instructorCollection.find().toArray();
      res.send(result);
    })


    // class apis
    app.get('/class', async(req, res)=>{
      const result = await classCollection.find().toArray();
      res.send(result)
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
