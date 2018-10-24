import mongoose from 'mongoose'

export const Account =  mongoose.model(
    'Account', 
    new mongoose.Schema({
        name: String, 
        balance: Number
    })
);

export const Transaction = mongoose.model(
    'Transaction', 
    new mongoose.Schema({
        from: String, 
        to: String,
        amount: Number,
        created: Date
    })
);
