const nodemailer = require('nodemailer');
require('dotenv').config({path:'config.env'});

let tp = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS
    },
  });


    
module.exports = { tp }