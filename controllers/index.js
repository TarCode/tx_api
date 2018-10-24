import mongoose from 'mongoose'
import { Account, Transaction } from '../schemas'

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
  const { name } = req.body
  try {
      const account = await Account.create({ name, balance: 0 });
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

export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find();
    return res.send({
      status: 'success',
      data: transactions
    })
  } catch (error) {
    return res.send({
      status: 'error',
      msg: error.message
    })
  }  
}

export const createTransfer = async (req, res) => {
    const { from, to, amount } = req.body
    try {
      // Fails because then A would have a negative balance
      const tx = await transfer(from, to, amount);
      return res.send({
        status: 'success',
        data: tx
      })
    } catch (error) {
      return res.send({
        status: 'error',
        msg: error.message
      });
    }
}


// The actual transfer logic
const transfer = async (from, to, amount) => {
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
  
      const tx = await Transaction.
      create({ from, to, amount, created: new Date() })

      await session.commitTransaction();
      session.endSession();
      return tx;
    } catch (error) {
      // If an error occurred, abort the whole transaction and
      // undo any changes that might have happened
      await session.abortTransaction();
      session.endSession();
      throw error; // Rethrow so calling function sees error
    }
  }