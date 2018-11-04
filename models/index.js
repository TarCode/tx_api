import mongoose from 'mongoose'
import { UserModel } from './user'

export const User = UserModel

export const Clan =  mongoose.model(
    'Clan', 
    new mongoose.Schema({
        name: {type: String, lowercase: true, unique: true }, 
        owner: String
    })
);

const WalletSchema = new mongoose.Schema({
    clan: String,
    name: String,
    created: Date,
    default: Boolean,
});

WalletSchema.index({default: 1, clan: 1 }, {unique: true, partialFilterExpression: {default: true}});

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
        account: String, 
        user_id: String,
        clan: String,
        source_account: String,
        destination_account: String,
        type: String,
        amount: Number,
        created: Date
    })
);
