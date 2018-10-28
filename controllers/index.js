import mongoose from 'mongoose'
import passport from 'passport'
import { Account, Transaction, User, Company } from '../models'

export const registerCompany = async (req, res) => {
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

export const register = async (req, res) => {
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

  const company = await Company.findOne({ name: user.company });

  const found_user = await User.findOne({ email: user.email, company: user.company })
  
  if (!company) {
    return res.send({
      status: 'error',
      msg: "Company does not exist"
    })
  }

  if (found_user) {
    return res.send({
      status: 'error',
      msg: "User already exists"
    })
  }

  const finalUser = new User(user);

  finalUser.setPassword(user.password);

  const savedUser = await finalUser.save()

  return res.json({ user: finalUser.toAuthJSON() })
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

export const getUsers = async (req, res) => {
  const { payload: { id, email, company } } = req;
  
  const found_company = await Company.findOne({ name: company });

  console.log("FOOUND COMPANY", found_company);
  console.log("ID AND EMAIL", id, email, company);

  
  if (found_company && found_company.owner === email) {
    const users = await User.find({ company });

    const filtered_users = users.map(user => ({
      _id: user._id,
      email: user.email,
      company: user.company
    }))
    return res.send({
      status: 'success',
      data: filtered_users
    })
  } else {
    return res.send({
      status: 'error',
      msg: 'Error getting users.'
    })
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
      const found_account = await Account.findOne({ name, company })

      if (found_account) {
        return res.send({
          status: 'error',
          msg: 'An account with this name already exists.'
        });
      } else {
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
      }
  } catch (error) {
      return res.send({
        status: 'error',
        msg: error.message
      });
  }
}

export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      company: req.payload.company
    });
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
    const { company, id } = req.payload

    try {
      const tx = await credit(account, amount, company, id);
      
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
  const { company, id } = req.payload

  try {
    const tx = await debit(account, amount, company, id);
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

// Transaction methods
const debit = async (account, amount, company, user_id) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const opts = { session, new: true };

    const A = await Account.findOneAndUpdate(
      { 
        name: account,
        company
      }, 
      { 
        $inc: { balance: -amount } 
      }, opts);

    if (!A) {
      throw new Error('No account found ');
    }

    if (A.balance < 0) {
      throw new Error('Insufficient funds: ' + (A.balance + amount));
    }

    const tx = await Transaction.create({ 
      account: account, 
      type: 'debit', 
      amount,
      company,
      user_id,
      created: new Date() 
    }, opts)

    await session.commitTransaction();
    session.endSession();
    return tx;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

const credit = async (account, amount, company, user_id) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const A = await Account.
      findOneAndUpdate({ name: account, company }, { $inc: { balance: amount } });

      if (!A) {
        throw new Error('No account found ');
      }

      const tx = await Transaction.create({ 
        account, 
        type: 'credit', 
        amount,
        user_id,
        company, 
        created: new Date() 
      })

      await session.commitTransaction();
      session.endSession();

      return tx;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}