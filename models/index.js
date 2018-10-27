import mongoose from 'mongoose'
import { UserModel } from './user'

export const User = UserModel

export const Company =  mongoose.model(
    'Company', 
    new mongoose.Schema({
        name: {type: String, lowercase: true, unique: true }, 
        owner: String
    })
);

export const Account =  mongoose.model(
    'Account', 
    new mongoose.Schema({
        user_id: String,
        company: String,
        name: String, 
        balance: Number
    })
);

export const Transaction = mongoose.model(
    'Transaction', 
    new mongoose.Schema({
        account: String, 
        user_id: String,
        company: String,
        source_account: String,
        destination_account: String,
        type: String,
        amount: Number,
        created: Date
    })
);
