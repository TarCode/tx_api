const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');

import { User } from '../models'

passport.use(new LocalStrategy({
  usernameField: 'email',
  passReqToCallback: true
}, function (req, username, password, done) {
    
    User.findOne({ email: req.body.email, company: req.body.company })
    .then((user) => {
        if(!user || !user.validatePassword(req.body.password)) {
            return done(null, false, { errors: { 'email or password': 'is invalid' } });
        }
        
        console.log("ENTERING HERE", user);
      return done(null, user);
    }).catch(done);
}));