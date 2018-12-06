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

const WalletSchema = new mongoose.Schema({
    company: String,
    name: String,
    currency_code: String,
    divisibility: Number, 
    created: Date,
    default: Boolean,
});

WalletSchema.index({default: 1, company: 1 }, {unique: true, partialFilterExpression: {default: true}});

export const Wallet =  mongoose.model(
    'Wallet', 
    WalletSchema
);

export const UserWallet = mongoose.model(
    'UserWallet', 
    new mongoose.Schema({
        balance: Number,
        user_id: String,
        wallet_id: String
    })
);

export const Transaction = mongoose.model(
    'Transaction', 
    new mongoose.Schema({
        wallet_id: String,
        user_wallet_id:String,
        created_by: String,
        created_for: String,
        divisibility: Number,
        currency_code: String,
        type: String,
        company: String,
        source_account: String,
        destination_account: String,
        amount: Number,
        created: Date
    })
);
