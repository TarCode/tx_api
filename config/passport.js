const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');

import { Users } from '../models'

passport.use(new LocalStrategy({
  usernameField: 'user[email]',
  companyField: 'user[company]',
  passwordField: 'user[password]',
}, (email, company, password, done) => {
  Users.findOne({ email, company })
    .then((user) => {
      if(!user || !user.validatePassword(password)) {
        return done(null, false, { errors: { 'email or password': 'is invalid' } });
      }

      return done(null, user);
    }).catch(done);
}));