const mongoose = require('mongoose');
const ObjectID = mongoose.Schema.Types.ObjectId;



const walletSchema = new mongoose.Schema({
    user:{
        type:ObjectID,
        ref:'users',
        require:true,
        unique:true
    },
    balance:{
        type:Number,
        default:0
    },
    transactions:[{
        type:ObjectID,
        ref:'Transactions'
    }],
})

 const wallet = mongoose.model('Wallet',walletSchema)
module.exports = wallet;