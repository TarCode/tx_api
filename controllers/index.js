import mongoose from 'mongoose'
import passport from 'passport'
import { ObjectID } from 'mongodb'

import { Wallet, Transaction, User, Clan } from '../models'

export const registerClan = async (req, res) => {
  const user = {
    email: req.body.email,
    clan: req.body.clan,
    password: req.body.password
  }

  if(!user.email) {
    return res.status(400).send({
      status: 'error',
      message: 'Email is required'
    });
  }

  if(!user.clan) {
    return res.status(400).send({
      status: 'error',
      message: 'Clan is required'
    });
  }

  if(!user.password) {
    return res.status(400).send({
      status: 'error',
      message: 'Password is required'
    });
  }

  try {
    const clan = await Clan.findOne({ name: user.clan });
    if (!clan) {
      const created_clan = await Clan.create({ name: user.clan, owner: user.email });
      
      const finalUser = await new User(user);
      
      finalUser.setPassword(user.password);
    
      await finalUser.save()

      return res.json({ user: finalUser.toAuthJSON(), clan: created_clan })
    } else {
      return res.send({
        status: 'error',
        msg: "Clan already exists"
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
    clan: req.body.clan,
    password: req.body.password
  }

  if(!user.email) {
    return res.status(400).send({
      status: 'error',
      message: 'Email is required'
    });
  }

  if(!user.clan) {
    return res.status(400).send({
      status: 'error',
      message: 'Clan is required'
    });
  }

  if(!user.password) {
    return res.status(400).send({
      status: 'error',
      message: 'Password is required'
    });
  }

  const clan = await Clan.findOne({ name: user.clan });

  const found_user = await User.findOne({ email: user.email, clan: user.clan })
  
  if (!clan) {
    return res.send({
      status: 'error',
      msg: "Clan does not exist"
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
    clan: req.body.clan,
    password: req.body.password
  }

  if(!user.email) {
    return res.status(400).send({
      status: 'error',
      message: 'Email is required'
    });
  }

  if(!user.clan) {
    return res.status(400).send({
      status: 'error',
      message: 'Clan is required'
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

export const getUsers = async (req, res) => {
  const { payload: { id, email, clan } } = req;
  
  const found_clan = await Clan.findOne({ name: clan });

  
  if (found_clan && found_clan.owner === email) {
    const users = await User.find({ clan });

    const filtered_users = users.map(user => ({
      _id: user._id,
      email: user.email,
      clan: user.clan
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
}

export const getWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find({
      clan: req.payload.clan
    });
    return res.send({
      status: 'success',
      data: wallets
    })
  } catch (error) {
    return res.send({
      status: 'error',
      msg: error.message
    })
  }  
}

export const createWallet = async (req, res) => {
  const { name } = req.body
  const { id, clan } = req.payload
  try {
      const found_wallet = await Wallet.findOne({ name, clan })
      const found_default = await Wallet.findOne({ clan, user_id: id, default: true })

      if (found_wallet) {
        return res.send({
          status: 'error',
          msg: 'An wallet with this name already exists.'
        });
      } else {
        const wallet = await Wallet.create({
          name, 
          user_id: id, 
          clan,
          created: new Date(),
          default: !found_default ? true : false,
          balance: 0 
       });
 
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

export const updateWallet = async (req, res) => {
  const { id, clan } = req.payload
  try {
    const set_prev_default_wallet_to_false = await Wallet.updateOne({ default: true, user_id: id }, { $set: { default: false }})
    const update_wallet = await Wallet.updateOne({ _id: ObjectID(req.params.id), clan }, { $set: { default: true }})
      
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

export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      clan: req.payload.clan
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
    const { wallet, amount } = req.body
    const { clan, id } = req.payload

    try {
      const tx = await credit(wallet, amount, clan, id);
      
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
  const { wallet, amount } = req.body
  const { clan, id } = req.payload

  try {
    const tx = await debit(wallet, amount, clan, id);
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
const debit = async (wallet, amount, clan, user_id) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const opts = { session, new: true };

    const A = await Wallet.findOneAndUpdate(
      { 
        name: wallet,
        clan
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
      wallet: wallet, 
      type: 'debit', 
      amount,
      clan,
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

const credit = async (wallet, amount, clan, user_id) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
      const A = await Wallet.findOneAndUpdate(
        { name: wallet, clan }, 
        { $inc: { balance: amount } }
      );

      if (!A) {
        throw new Error('No wallet found ');
      }

      const tx = await Transaction.create({ 
        wallet, 
        type: 'credit', 
        amount,
        user_id,
        clan, 
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