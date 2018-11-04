import mongoose from 'mongoose'
import passport from 'passport'
import { ObjectID } from 'mongodb'

import { Wallet, UserWallet, Transaction, User, Clan } from '../models'

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

  // Create new user
  const finalUser = new User(user);

  // Set new user's password
  finalUser.setPassword(user.password);

  // Save user
  const savedUser = await finalUser.save()

  console.log('saved user', savedUser)

  // Find clan's default wallet and create wallet for user
  const found_default_wallet = await Wallet.findOne({ clan: user.clan, default: true })

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

export const adminGetUsers = async (req, res) => {
  const { payload: { id, email, clan } } = req;
  
  const found_clan = await Clan.findOne({ name: clan });

  console.log("FOIUND CLAN", email);
  
  
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
      msg: 'Unauthorized: Error getting users.'
    })
  }
}

export const adminGetWallets = async (req, res) => {
  try {
    const clan_wallets = await Wallet.find({
      clan: req.payload.clan
    });

    const wallet_names = {}
    
    clan_wallets.map(w => {
      wallet_names[w._id.toString()] = {
        name: w.name,
        default: w.default
      }

    })

    const wallet_ids = clan_wallets.map(c => c._id)

    const user_wallets = await UserWallet.find({
      wallet_id: { $in: wallet_ids }
    })

    

    const user_wallets_with_name = user_wallets.map(w => {
      const data = {
        user_id: w.user_id,
        balance: w.balance,
        wallet_id: w.wallet_id,
        name: wallet_names[w.wallet_id].name,
        default: wallet_names[w.wallet_id].default
      }
      console.log("WALLET ID",data);
      
      return data
    })
    
    return res.send({
      status: 'success',
      data: {
        user_wallets: user_wallets_with_name,
        clan_wallets
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
  const { name } = req.body
  const { id, clan } = req.payload
  try {
      const found_wallet = await Wallet.findOne({ name, clan })
      const found_default = await Wallet.findOne({ clan, default: true })

      if (found_wallet) {
        return res.send({
          status: 'error',
          msg: 'A wallet with this name already exists.'
        });
      } else {

        const wallet = await Wallet.create({
          name, 
          clan,
          created: new Date(),
          // default: !found_default ? true : null
          
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
  const { id, clan } = req.payload
  try {
    const set_prev_default_wallet_to_false = await Wallet.updateOne({ default: true, clan }, { $set: { default: false }})
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

export const adminGetTransactions = async (req, res) => {
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

export const adminCreateCredit = async (req, res) => {
    const { wallet_id, amount, user_id } = req.body
    const { clan, id } = req.payload

    try {
      const tx = await credit(wallet_id, amount, clan, user_id, id);
      
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

export const adminCreateDebit = async (req, res) => {
  const { wallet_id, amount, user_id } = req.body
  const { clan, id } = req.payload

  try {
    const tx = await debit(wallet_id, amount, clan, user_id, id);
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
const debit = async (wallet_id, amount, clan, user_id, id) => {
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
      clan,
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

const credit = async (wallet_id, amount, clan, user_id, id) => {
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
        clan, 
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