import mongoose from 'mongoose'
import passport from 'passport'
import { Account, Transaction, User, Company } from '../models'

export const registerCompany = async (req, res, next) => {
  const user = {
    email: req.body.email,
    company: req.body.company,
    password: req.body.password
  }

  if(!user.email) {
    return res.status(422).json({
      errors: {
        email: 'is required',
      },
    });
  }

  if(!user.company) {
    return res.status(422).json({
      errors: {
        company: 'is required',
      },
    });
  }

  if(!user.password) {
    return res.status(422).json({
      errors: {
        password: 'is required',
      },
    });
  }
  try {
    const company = await Company.findOne({ name: user.company });
    if (!company) {
      const created_company = await Company.create({ name: user.company, owner: user.email });
      
      const finalUser = await new User(user);
      
      finalUser.setPassword(user.password);
    
      await finalUser.save()

      return res.json({ user: finalUser.toAuthJSON(), company: created_company })
    } else {
      return res.send({
        status: 'error',
        msg: "Company already exists"
      })
    }
  } catch (error) {
    return res.send({
      status: 'error',
      msg: error.message
    })
  }
}

export const register = async (req, res, next) => {
  const user = {
    email: req.body.email,
    company: req.body.company,
    password: req.body.password
  }

  if(!user.email) {
    return res.status(422).json({
      errors: {
        email: 'is required',
      },
    });
  }

  if(!user.company) {
    return res.status(422).json({
      errors: {
        company: 'is required',
      },
    });
  }

  if(!user.password) {
    return res.status(422).json({
      errors: {
        password: 'is required',
      },
    });
  }

  const company = await Company.find({ name: user.company });

  if (company) {
    const finalUser = new User(user);

    finalUser.setPassword(user.password);

    const savedUser = await finalUser.save()

    return res.json({ user: finalUser.toAuthJSON() })
  } else {
      return res.send({
        status: 'error',
        msg: "Company does not exist"
      })
  }
}

export const login = (req, res, next) => {
  const user = {
    email: req.body.email,
    company: req.body.company,
    password: req.body.password
  }

  if(!user.email) {
    return res.status(422).json({
      errors: {
        email: 'is required',
      },
    });
  }

  if(!user.company) {
    return res.status(422).json({
      errors: {
        company: 'is required',
      },
    });
  }

  if(!user.password) {
    return res.status(422).json({
      errors: {
        password: 'is required',
      },
    });
  }

  return passport.authenticate('local', { session: false }, (err, passportUser, info) => {
    if(err) {
      return next(err);
    }

    console.log("PASSPORT USERRRR", err, passportUser);
    

    if(passportUser) {
      const user = passportUser;
      user.token = passportUser.generateJWT();

      return res.json({ user: user.toAuthJSON() });
    }

    return res.status(400).send({
      status: 'error',
      message: info
    });
  })(req, res, next);
}

export const currentUser = async (req, res, next) => {
  const { payload: { id } } = req;
  
  const user = await User.findById(id);
  
  if(!user) {
      return res.sendStatus(400);
  }

  return res.json({ user: user.toAuthJSON() });
}

export const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({
      company: req.payload.company
    });
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
  const { id, company } = req.payload
  try {
      const account = await Account.create({
         name, 
         user_id: id, 
         company, 
         balance: 0 
      });

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

export const createCredit = async (req, res) => {
    const { account, amount } = req.body
    try {
      const tx = await credit(account, amount);
      
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

export const createDebit = async (req, res) => {
  const { account, amount } = req.body
  try {
    // Fails because then A would have a negative balance
    const tx = await debit(account, amount);
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

// export const createTransfer = async (req, res) => {
//   const { from, to, amount } = req.body
//   try {
//     // Fails because then A would have a negative balance
//     const tx = await transfer(from, to, amount);
//     return res.send({
//       status: 'success',
//       data: tx
//     })
//   } catch (error) {
//     return res.send({
//       status: 'error',
//       msg: error.message
//     });
//   }
// }


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

  const debit = async (account, amount) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const opts = { session, new: true };
      const A = await Account.
        findOneAndUpdate({ name: account }, { $inc: { balance: -amount } }, opts);
      if (A.balance < 0) {
        // If A would have negative balance, fail and abort the transaction
        // `session.abortTransaction()` will undo the above `findOneAndUpdate()`
        throw new Error('Insufficient funds: ' + (A.balance + amount));
      }
  
      const tx = await Transaction.
      create({ account: account, type: 'debit', amount, created: new Date() }, opts)

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

const credit = async (account, amount) => {
    const A = await Account.
      findOneAndUpdate({ name: account }, { $inc: { balance: amount } });

      const tx = await Transaction.
      create({ account: account, type: 'credit', amount, created: new Date() })
      
      console.log("IM GETTING TO THIS POINT", tx);
    return tx;
}