import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import path from 'path'
import session from 'express-session'
import errorHandler from 'errorhandler'

const app = express()
const isProduction = process.env.NODE_ENV === 'production';



app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'passport-tx', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }));

if(!isProduction) {
    app.use(errorHandler());
}

app.all("/*", function(req, res, next) {
  if (req.method == "OPTIONS") {
    res.status(200).end();
  } else {
    next();
  }
});

module.exports = app;