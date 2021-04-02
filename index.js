/*
* Title: Mobile Planet Server
* Description: A Restful Api of Mobile Planet
* Author: A.K.M Fozlol Hoq 
* Date: 01/ 04/ 2021
*/

// Dependencies
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser')
const cors = require('cors')
const ObjectId = require('mongodb').ObjectID;
var admin = require("firebase-admin");
var serviceAccount = require("./mobile-planet-fozlol-firebase-adminsdk-5l3dg-4a4d8aeee1.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


// Configaration
require('dotenv').config()
const port = process.env.PORT || 5055;
const app = express();
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mfwri.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


// Middlewares
app.use(bodyParser.json());
app.use(cors());

// hello world
app.get('/', (req, res) => {
  res.send('Hello World!')
})


// Connect MongoDB
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const phoneCollection = client.db("mobile-planet").collection("phones");
  const orderCollection = client.db("mobile-planet").collection("orders");

  // This API will return all the phones
  app.get('/phones', (req, res) => {
    phoneCollection.find({})
      .toArray((err, items) => {
        res.send(items)
      })
  })

  // This API will return phone by matching its id/key
  app.get('/phone/:key', (req, res) => {
    phoneCollection.find({'_id': ObjectId(`${req.params.key}`)})
    .toArray((err, documents) => {
      res.send(documents[0])
    })
  })


  // This API will add a phone to the MongoDB database
  app.post('/addPhone', (req, res) => {
    const newPhone = req.body;
    console.log('adding new phone: ', newPhone)
    phoneCollection.insertOne(newPhone)
      .then(result => {
        console.log('inserted count', result.insertedCount);
        res.send(result.insertedCount > 0)
      })
  })


  // This API will delete a(specific) phone from MongoDB database
  app.delete('/deletephone/:id',(req,res)=>{
    phoneCollection.deleteOne({_id:ObjectId(req.params.id)})
    .then(result=>{
        res.send(result.deletedCount  >0)
    })
})

  // This API will add a phone to the cart of the user
  app.post('/addOrder', (req, res) => {
    const order = req.body;
    orderCollection.insertOne(order)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
      .catch(err => {
        console.log("DB Connection Error");
      });
  })

  app.get('/orders', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          console.log(tokenEmail, queryEmail)
          if (tokenEmail == queryEmail) {
            orderCollection.find({ email : queryEmail })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              })
          } else {
            res.status(401).send('Unauthorized access')
          }
          // ...
        })
        .catch((error) => {
          res.status(401).send('Unauthorized access')
        });
    }
    else {
      res.status(401).send('Unauthorized access')
    }
  })






  // This API will return all phones from the user's cart list
  app.post('/phonesbykeys', (req, res) => {
    const phoneKeys = req.body;
    phoneCollection.find({ key: { $in: phoneKeys } })
      .toArray((err, documents) => {
        res.send(documents)
      })
  })

});

// Start the server
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

