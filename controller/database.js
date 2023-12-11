const mongoose=require('mongoose');
require('dotenv').config({path:'config.env'});
mongoose.connect(process.env.MONGODB,{
    useNewUrlParser:true,
    tlsAllowInvalidHostnames:true,
    tlsAllowInvalidCertificates:true,
    ssl:true

})
.then(()=>{
    console.log(`Mongodb Connected`)
})
.catch((err)=>{
    console.log("Error connecting to db:",err)
    process.exit(1)
})
const bcrypt = require('bcryptjs')

var userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    mobile:{
        type:Number
    },
    admin:{
        type:Boolean,
        default:false
    },
    isverified:{
      type:Boolean,
      default:false  
    },
    otp:{
        code:String,
        expiresat:Date
    },
    gender:String,
    status:{
        type:String,
        default:"Active"
    },
    transactions:[
        {
        type: {
            type: String, // 'debit' or 'credit'
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    ],
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet', // Reference to the 'Wallet' model
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    resetToken: {
        type: String,
        default: null
    },
    resetTokenExpiration: {
        type: Date,
        default: null
    },
    referralcode:{
        type:String
    }
}, {
    timestamps: true
})

// Hash plain password before saving
userSchema.pre('save', async function(next) {
    const user = this;
    if (user.isModified('password')) {
        console.log(user.password)
        user.password = await bcrypt.hash(user.password, 10);
        console.log(user.password)
    }

    // Call next to continue with the saving process
    next();
});
const Userdb=mongoose.model('users',userSchema)
module.exports= Userdb;