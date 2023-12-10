const nodemailer = require('nodemailer');
require('dotenv').config({path:'config.env'});

let tp = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'dheerajpradi@gmail.com',
      pass: 'zowhtkjslmnmyfnq'
    },
  });


    
module.exports = { tp }