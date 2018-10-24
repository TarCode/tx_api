import express from 'express'
import mongoose from 'mongoose'

import { 
    getAccounts, 
    createAccount, 
    getTransactions, 
    createTransfer 
} from '../controllers'

const app = express()

const uri = 'mongodb://localhost:27017,localhost:27018,localhost:27019/txn';

mongoose.connect(uri, { replicaSet: 'rs', useNewUrlParser: true  });

// mongoose.connection.dropDatabase();

app.get('/accounts', getAccounts)
app.post('/accounts', createAccount)

app.get('/transactions', getTransactions)
app.post('/transactions/send', createTransfer)

module.exports = app;
