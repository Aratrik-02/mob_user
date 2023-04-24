const express=require('express');
const app=express();
require('dotenv').config()

var cors = require('cors');
app.use(cors());

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(()=>{
    console.log("Connected to MongoDB");
}).catch((err)=>{
    console.log(err);
})


const userSchema = new mongoose.Schema({
    id: Number,
    first_name: String,
    last_name: String,
    email: String,
    gender: String,
    income: String,
    city: String,
    car: String,
    quote: String,
    phone_price: String
});

const User = mongoose.model('User', userSchema);

app.get('/api/users/income-lower-than-5-and-car-make-bmw-mercedes', async function(req, res) {
    try {
    const users = await User.aggregate([
        { $match: { car: { $regex: /^(BMW|Mercedes)/ } } },
        {
          $addFields: {
            income_num: {
              $convert: {
                input: { $substr: ["$income", 1, { $strLenCP: "$income" }] },
                to: "double",
                onError: 0
              }
            }
          }
        },
        { $match: { income_num: { $lt: 5 } } }
      ]).exec();
      res.send(users);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
  });
  
app.get('/api/users/male-with-phone-price-greater-than-10000', async function(req, res) {
  try {
      const users = await User.aggregate([
          {
              $match: {
                  gender: 'Male',
                  phone_price: { $regex: /^[0-9]+$/ }
              }
          },
          {
              $addFields: {
                  phone_price_double: { $toDouble: "$phone_price" }
              }
          },
          {
              $match: {
                  phone_price_double: { $gt: 10000 }
              }
          }
      ]).exec();
      res.send(users);
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
  }
});

app.get('/api/users/quote-length-greater-than-15-and-email-includes-name', async function(req, res) {
  try {
      const users = await User.find({
          $and: [
              { last_name: { $regex: '^M' } },
              { quote: { $regex: /^.{16,}$/ } },
              {
                  $or: [
                      { email: { $regex: /.*\b(m\w+|Mc\w+|Ma\w+|Mi\w+|Mo\w+|Mu\w+)\b@.*/i } },
                      { email: { $regex: /.*\b(j\w+|Ja\w+|Je\w+|Jo\w+|Ju\w+)\b@.*/i } },
                      { email: { $regex: /.*\b(d\w+|Da\w+|De\w+|Do\w+)\b@.*/i } },
                      { email: { $regex: /.*\b(r\w+|Ra\w+|Re\w+|Ro\w+)\b@.*/i } },
                      { email: { $regex: /.*\b(s\w+|Sa\w+|Se\w+|Si\w+|So\w+)\b@.*/i } },
                      { email: { $regex: /.*\b(t\w+|Ta\w+|Te\w+|Ti\w+|To\w+|Tr\w+)\b@.*/i } }
                  ]
              }
          ]
      }).exec();
      res.send(users);
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
  }
}); 
app.get('/api/users/car-brand-and-email-without-digit', async function(req, res) {
try {
    const users = await User.find({
    car: { $in: ["BMW", "Mercedes", "Audi"] },
    email: { $not: { $regex: /\d/ } }
    }).exec();
    res.send(users);
} catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
}
});
  
app.get('/api/users/top-10-cities-with-highest-users', async function(req, res) {
  try {
      const users = await User.aggregate([
          {
              $group: {
                  _id: "$city",
                  count: { $sum: 1 },
                  average_income: {
                      $avg: { $toDouble: { $substr: ["$income", 1, { $strLenCP: "$income" }] } }
                  }
              }
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
          {
              $project: {
                  _id: "$_id",
                  city: "$_id",
                  count: 1,
                  average_income: { $round: ["$average_income", 3] }
              }
          }
      ]).exec();
      res.send(users);
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
  }
});

app.listen(process.env.PORT,()=>{
    console.log("Server is running on port 4000");
})
