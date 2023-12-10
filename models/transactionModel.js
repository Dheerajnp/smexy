const mongoose = require('mongoose');
const ObjectID = mongoose.Schema.Types.ObjectId;

const transactionSchema = new mongoose.Schema({
    userId:{
        type:ObjectID,
        ref:"users",
        required:true
    },
    transactions:[{
        transactionType:{
            type:String,
            required:true
        },
        amount:{
            type:Number,
            required:true
        },
        date:{
            type: Date,
            default: Date.now()
        },
        payment:{
            type:String,
        }
        
    }],
  
})


const transactions = mongoose.model('Transactions',transactionSchema)
module.exports = transactions;
