import mongoose from 'mongoose'

export const Account = mongoose.model(
    'Account', 
    new mongoose.Schema({
        name: String, balance: Number
    })
);