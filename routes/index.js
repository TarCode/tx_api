import express from 'express'
import mongoose from 'mongoose'
import auth from './auth'

import { 
    getWallets, 
    createWallet,
    updateWallet,
    getTransactions,
    createDebit,
    createCredit,
    registerClan,
    register,
    login,
    getUsers
} from '../controllers'

const app = express()

const uri = 'mongodb://localhost:27017,localhost:27018,localhost:27019/txn';

mongoose.connect(uri, { replicaSet: 'rs', useNewUrlParser: true  });

// mongoose.connection.dropDatabase();

import '../models'
import '../config/passport'


// public methods
app.post('/auth/clan/register', auth.optional, registerClan);
app.post('/auth/register', auth.optional, register);
app.post('/auth/login', auth.optional, login);
  
// protected methods
app.get('/admin/users', auth.required, getUsers);

app.get('/wallets', auth.required, getWallets)
app.post('/wallets', auth.required, createWallet)
app.post('/wallets/:id', auth.required, updateWallet)

app.get('/transactions', auth.required, getTransactions)
app.post('/transactions/debit', auth.required, createDebit)
app.post('/transactions/credit', auth.required, createCredit)


module.exports = app;
