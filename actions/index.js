import mongoose from 'mongoose'
import { Account } from '../schemas'

export const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find();
    return res.send({
      status: 'success',
      data: accounts
    })
  } catch (error) {
    return res.send({
      status: 'error',
      msg: error.message
    })
  }  
}

export const createAccount = async (req, res) => {
  try {
      const account = await Account.create([{ name: 'C', balance: 15 }, { name: 'D', balance: 20 }]);
      return res.send({
        status: 'success',
        data: account
      })
  } catch (error) {
      return res.send({
        status: 'error',
        msg: error.message
      });
  }
}


// The actual transfer logic
export const transfer = async (from, to, amount) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const opts = { session, new: true };
      const A = await Account.
        findOneAndUpdate({ name: from }, { $inc: { balance: -amount } }, opts);
      if (A.balance < 0) {
        // If A would have negative balance, fail and abort the transaction
        // `session.abortTransaction()` will undo the above `findOneAndUpdate()`
        throw new Error('Insufficient funds: ' + (A.balance + amount));
      }
  
      const B = await Account.
        findOneAndUpdate({ name: to }, { $inc: { balance: amount } }, opts);
  
      await session.commitTransaction();
      session.endSession();
      return { from: A, to: B };
    } catch (error) {
      // If an error occurred, abort the whole transaction and
      // undo any changes that might have happened
      await session.abortTransaction();
      session.endSession();
      throw error; // Rethrow so calling function sees error
    }
  }