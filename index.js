const express = require('express');
const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017,localhost:27018,localhost:27019/txn';

const app = express()
const port = 3000

mongoose.connect(uri, { replicaSet: 'rs', useNewUrlParser: true  });

mongoose.connection.dropDatabase();
const Account = mongoose.model('Account', new mongoose.Schema({
  name: String, balance: Number
}));

app.get('/', (req, res) => {
  return res.send('Hello World!')
})

app.get('/accounts', async (req, res) => {
  try {
    const accounts = await Account.find();
    return res.send(accounts)
  } catch (error) {
    return res.send(error.message); // "Insufficient funds: 1"
  }  
})


app.get('/accounts/create', async (req, res) => {
  try {
    const account = await Account.create([{ name: 'A', balance: 5 }, { name: 'B', balance: 10 }]);
    return res.send(account)
  } catch (error) {
    return res.send(error.message);
  }
})

// const start = async () => {
//     // Insert accounts and transfer some money
//     const account = await Account.create([{ name: 'A', balance: 5 }, { name: 'B', balance: 10 }]);

//     await transfer('A', 'B', 4); // Success
//     try {
//     // Fails because then A would have a negative balance
//     await transfer('A', 'B', 2);
//     } catch (error) {
//     error.message; // "Insufficient funds: 1"
//     }
// }

// start();

// The actual transfer logic
async function transfer (from, to, amount) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const opts = { session, new: true };
    const A = await Account.
      findOneAndUpdate({ name: from }, { $inc: { balance: -amount } }, opts);
    if (A.balance < 0) {
      // If A would have negative balance, fail and abort the transaction
      // `session.abortTransaction()` will undo the above `findOneAndUpdate()`
      throw new Error('Insufficient funds: ' + (A.balance + amount));
    }

    const B = await Account.
      findOneAndUpdate({ name: to }, { $inc: { balance: amount } }, opts);

    await session.commitTransaction();
    session.endSession();
    return { from: A, to: B };
  } catch (error) {
    // If an error occurred, abort the whole transaction and
    // undo any changes that might have happened
    await session.abortTransaction();
    session.endSession();
    throw error; // Rethrow so calling function sees error
  }
}

app.listen(port, () => console.log(`Example app listening on port ${port}!`))