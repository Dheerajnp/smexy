const { transporter } = require('../config/otpGenerator'); // Import your Nodemailer transporter

require('dotenv').config({path:'config.env'});

const otpModel = require('../models/otpModel')

const User = require('./database');

const crypto = require('crypto')

const otpGenerator = require('otp-generator');

