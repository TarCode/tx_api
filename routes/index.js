import express from 'express'
import mongoose from 'mongoose'
import auth from './auth'

import { 
    adminGetWallets, 
    adminCreateWallet,
    adminUpdateWallet,
    adminGetTransactions,
    adminCreateDebit,
    adminCreateCredit,
    registerClan,
    register,
    login,
    adminGetUsers
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
  
// protected admin methods
app.get('/admin/users', auth.required, adminGetUsers);
app.get('/admin/wallets', auth.required, adminGetWallets)
app.post('/admin/wallets', auth.required, adminCreateWallet)
app.post('/admin/wallets/:id', auth.required, adminUpdateWallet)

app.get('/admin/transactions', auth.required, adminGetTransactions)
app.post('/admin/transactions/debit', auth.required, adminCreateDebit)
app.post('/admin/transactions/credit', auth.required, adminCreateCredit)


module.exports = app;
