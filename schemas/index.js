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
        account: String, 
        source_account: String,
        destination_account: String,
        type: String,
        amount: Number,
        created: Date
    })
);
