import mongoose from 'mongoose'
import passport from 'passport'
import { ObjectID } from 'mongodb'

import { Wallet, UserWallet, Transaction, User, Company } from '../models'

export const registerCompany = async (req, res) => {
  const user = {
    email: req.body.email,
    company: req.body.company,
    password: req.body.password
  }

  if(!user.email) {
    return res.status(400).send({
      status: 'error',
      message: 'Email is required'
    });
  }

  if(!user.company) {
    return res.status(400).send({
      status: 'error',
      message: 'Company is required'
    });
  }

  if(!user.password) {
    return res.status(400).send({
      status: 'error',
      message: 'Password is required'
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
    return res.status(400).send({
      status: 'error',
      message: 'Email is required'
    });
  }

  if(!user.company) {
    return res.status(400).send({
      status: 'error',
      message: 'Company is required'
    });
  }

  if(!user.password) {
    return res.status(400).send({
      status: 'error',
      message: 'Password is required'
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

  // Create new user
  const finalUser = new User(user);

  // Set new user's password
  finalUser.setPassword(user.password);

  // Save user
  const savedUser = await finalUser.save()


  // Find company's default wallet and create wallet for user
  const found_default_wallet = await Wallet.findOne({ company: user.company, default: true })

  if (found_default_wallet) {
    const user_wallet = await UserWallet.create({
      user_id: savedUser._id,
      balance: 0,
      wallet_id: found_default_wallet._id
     })
  }

  return res.json({ user: finalUser.toAuthJSON() })
}

export const login = (req, res, next) => {
  const user = {
    email: req.body.email,
    company: req.body.company,
    password: req.body.password
  }

  if(!user.email) {
    return res.status(400).send({
      status: 'error',
      message: 'Email is required'
    });
  }

  if(!user.company) {
    return res.status(400).send({
      status: 'error',
      message: 'Company is required'
    });
  }

  if(!user.password) {
    return res.status(400).send({
      status: 'error',
      message: 'Password is required'
    });
  }

  return passport.authenticate('local', { session: false }, (err, passportUser, info) => {
    if(err) {
      return next(err);
    }
    

    if(passportUser) {
      const user = passportUser;
      user.token = passportUser.generateJWT();

      return res.json({ user: user.toAuthJSON() });
    }

    return res.status(400).send({
      status: 'error',
      message: 'User not found'
    });
  })(req, res, next);
}

// User controllers
export const userGetWallet = async (req, res, next) => {
  try {
    const company_wallet = await Wallet.findOne({
      company: req.payload.company,
      default: true
    });


    const user_wallet = await UserWallet.findOne({
      wallet_id: company_wallet._id,
      user_id: req.payload.id
    })


    const wallet = {
      _id: company_wallet._id,
      user_id: user_wallet.user_id,
      balance: parseInt(user_wallet.balance, 10),
      currency_code: company_wallet.currency_code,
      divisibility: company_wallet.divisibility,
      user_wallet_id: user_wallet._id,
      name: company_wallet.name,
      default: company_wallet.default
    }

    const transactions = await Transaction.find({
      user_wallet_id: user_wallet._id
    });
    
    return res.send({
      status: 'success',
      data: {
        wallet,
        transactions: transactions.reverse()
      }
    })
  } catch (error) {
    return res.send({
      status: 'error',
      msg: error.message
    })
  }  
}

export const userCreateTransfer = async (req, res) => {
  const { 
    wallet_id, 
    amount, 
    user_id, 
    currency_code, 
    divisibility, 
    user_wallet_id, 
    recipient 
  } = req.body

  const { company, id } = req.payload

  const created_for = await User.findOne({ email: recipient })

  console.log("CREATED FOR", created_for);

  if (!created_for) {
    return res.send({
      status: 'error',
      msg: 'Invalid recipient'
    });
  }
  

  try {
    const tx = await transfer(wallet_id, amount, company, user_id, id, currency_code, divisibility, user_wallet_id, created_for._id);
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


// Admin controllers
export const adminGetUsers = async (req, res) => {
  const { payload: { id, email, company } } = req;
  
  const found_company = await Company.findOne({ name: company });
  
  
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
      msg: 'Unauthorized: Error getting users.'
    })
  }
}

export const adminGetWallets = async (req, res) => {
  try {
    const company_wallets = await Wallet.find({
      company: req.payload.company
    });

    const wallet_names = {}
    
    company_wallets.map(w => {
      wallet_names[w._id.toString()] = {
        name: w.name,
        default: w.default,
        currency_code: w.currency_code,
        divisibility: w.divisibility
      }

    })

    const wallet_ids = company_wallets.map(c => c._id)

    const user_wallets = await UserWallet.find({
      wallet_id: { $in: wallet_ids }
    })

    

    const user_wallets_with_name = user_wallets.map(w => {
      const data = {
        _id: w._id,
        user_id: w.user_id,
        balance: wallet_names[w.wallet_id].currency_code + (parseInt(w.balance, 10) / Math.pow(10, wallet_names[w.wallet_id].divisibility).toFixed(wallet_names[w.wallet_id].divisibility)),
        wallet_id: w.wallet_id,
        name: wallet_names[w.wallet_id].name,
        default: wallet_names[w.wallet_id].default
      }
      
      return data
    })
    
    return res.send({
      status: 'success',
      data: {
        user_wallets: user_wallets_with_name,
        company_wallets
      }
    })
  } catch (error) {
    return res.send({
      status: 'error',
      msg: error.message
    })
  }  
}

export const adminCreateWallet = async (req, res) => {
  const { name, currency_code, divisibility } = req.body
  const { id, company } = req.payload
  try {
      const found_wallet = await Wallet.findOne({ name, company })
      const found_default = await Wallet.findOne({ company, default: true })

      if (found_wallet) {
        return res.send({
          status: 'error',
          msg: 'A wallet with this name already exists.'
        });
      } else {

        const wallet = await Wallet.create({
          name, 
          company,
          currency_code,
          divisibility,
          created: new Date(),
          default: !found_default ? true : false
          
       });


       const user_wallet = await UserWallet.create({
        user_id: id,
        balance: 0,
        wallet_id: wallet._id
       })
 
       return res.send({
         status: 'success',
         data: wallet
       })
      }
  } catch (error) {
      return res.send({
        status: 'error',
        msg: error.message
      });
  }
}

export const adminUpdateWallet = async (req, res) => {
  const { id, company } = req.payload
  try {
    const set_prev_default_wallet_to_false = await Wallet.updateOne({ default: true, company }, { $set: { default: false }})
    const update_wallet = await Wallet.updateOne({ _id: ObjectID(req.params.id), company }, { $set: { default: true }})
      
    return res.send({
      status: 'success',
      data: 'Updated'
    })
  } catch (error) {
      return res.send({
        status: 'error',
        msg: error.message
      });
  }
}

export const adminGetTransactions = async (req, res) => {
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

export const adminCreateCredit = async (req, res) => {
    const { wallet_id, amount, user_id, currency_code, divisibility, user_wallet_id } = req.body
    const { company, id, email } = req.payload

  
   try {
    const found_company = await Company.findOne({ name: company });

    if (found_company && found_company.owner === email) {
      try {
        const tx = await credit(wallet_id, amount, company, user_id, id, currency_code, divisibility, user_wallet_id);
        
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
    } else {
      return res.send({
        status: 'error',
        msg: "Unauthorized: Cannot create transaction"
      });
    }
   } catch (err) {
    return res.send({
      status: 'error',
      msg: "Unauthorized: Cannot create transaction"
    });
   }
    
}

export const adminCreateDebit = async (req, res) => {
  const { wallet_id, amount, user_id, currency_code, divisibility, user_wallet_id } = req.body
  const { company, id, email } = req.payload
  
  try {
    const found_company = await Company.findOne({ name: company });

    if (found_company && found_company.owner === email) {
      try {
        const tx = await debit(wallet_id, amount, company, user_id, id, currency_code, divisibility, user_wallet_id);
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
    } else {
      return res.send({
        status: 'error',
        msg: "Unauthorized: Cannot create transaction"
      });
    }
  } catch (err) {
    return res.send({
      status: 'error',
      msg: "Unauthorized: Cannot create transaction"
    });
  }
}

// Admin transaction methods
const debit = async (wallet_id, amount, company, user_id, id, currency_code, divisibility, user_wallet_id) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const opts = { session, new: true };

    const A = await UserWallet.findOneAndUpdate(
      { 
        user_id: user_id,
        wallet_id: wallet_id
      }, 
      { 
        $inc: { balance: -amount } 
      }, opts);

    if (!A) {
      throw new Error('No wallet found ');
    }

    if (A.balance < 0) {
      throw new Error('Insufficient funds: ' + parseInt(A.balance + parseInt(amount)));
    }

    const tx = await Transaction.create({ 
      wallet_id, 
      created_by: id,
      created_for: user_id,
      type: 'debit', 
      amount,
      company,
      currency_code,
      divisibility,
      user_wallet_id,
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

const credit = async (wallet_id, amount, company, user_id, id, currency_code, divisibility, user_wallet_id) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
      const A = await UserWallet.findOneAndUpdate(
        { user_id, wallet_id }, 
        { $inc: { balance: amount } }
      );

      if (!A) {
        throw new Error('No wallet found ');
      }

      const tx = await Transaction.create({ 
        wallet_id, 
        created_by: id,
        created_for: user_id,
        type: 'credit',
        currency_code,
        divisibility,
        user_wallet_id,
        company, 
        amount,
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

const transfer = async (wallet_id, amount, company, user_id, id, currency_code, divisibility, user_wallet_id, created_for) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const opts = { session, new: true };

    const A = await UserWallet.findOneAndUpdate(
      { 
        user_id: user_id,
        wallet_id: wallet_id
      }, 
      { 
        $inc: { balance: -amount } 
      }, opts);

    if (!A) {
      throw new Error('No wallet found ');
    }

    if (A.balance < 0) {
      throw new Error('Insufficient funds: ' + parseInt(A.balance + parseInt(amount)));
    }

    const B = await UserWallet.findOneAndUpdate(
      { 
        user_id: created_for,
        wallet_id: wallet_id
      }, 
      { 
        $inc: { balance: amount } 
      }, opts);

    const created = new Date();

    const tx1 = await Transaction.create({ 
      wallet_id, 
      created_by: user_id,
      created_for: created_for,
      type: 'debit', 
      amount,
      company,
      currency_code,
      divisibility,
      user_wallet_id,
      created
    }, opts)

    console.log("USERWALLET ID, SECOND ACCOUNT FOUND", user_wallet_id);
    

    const tx2 = await Transaction.create({ 
      wallet_id, 
      created_by: user_id,
      created_for: created_for,
      type: 'credit', 
      amount,
      company,
      currency_code,
      divisibility,
      user_wallet_id: B._id,
      created,
    }, opts)

    await session.commitTransaction();
    session.endSession();
    return {tx1, tx2};
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}