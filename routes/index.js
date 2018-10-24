import express from 'express'
import mongoose from 'mongoose'
import auth from './auth'

import { 
    getAccounts, 
    createAccount, 
    getTransactions,
    createDebit,
    createCredit,
    registerCompany,
    register,
    login,
    currentUser
} from '../controllers'

const app = express()

const uri = 'mongodb://localhost:27017,localhost:27018,localhost:27019/txn';

mongoose.connect(uri, { replicaSet: 'rs', useNewUrlParser: true  });

// mongoose.connection.dropDatabase();

import '../models'
import '../config/passport'


// public methods
app.post('/auth/company/register', auth.optional, registerCompany);
app.post('/auth/register', auth.optional, register);
app.post('/auth/login', auth.optional, login);
  
// protected methods
app.get('/current', auth.required, currentUser);

app.get('/accounts', auth.required, getAccounts)
app.post('/accounts', auth.required, createAccount)

app.get('/transactions', auth.required, getTransactions)
app.post('/transactions/debit', auth.required, createDebit)
app.post('/transactions/credit', auth.required, createCredit)


module.exports = app;
