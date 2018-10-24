import express from 'express'
import mongoose from 'mongoose'

import { getAccounts, createAccount, createTransfer } from '../actions'

const app = express()

const uri = 'mongodb://localhost:27017,localhost:27018,localhost:27019/txn';

mongoose.connect(uri, { replicaSet: 'rs', useNewUrlParser: true  });

// mongoose.connection.dropDatabase();

app.get('/accounts', getAccounts)
  
app.get('/accounts/create', createAccount)

app.post('/transfer', createTransfer)

module.exports = app;
