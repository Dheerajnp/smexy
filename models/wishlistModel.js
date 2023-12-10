const mongoose = require('mongoose');
const ObjectID = mongoose.Schema.Types.ObjectId;


const wishlistSchema = new mongoose.Schema({
    userId:{
        type:ObjectID,
        ref:'users',
        required:true,
    },
    products:[{
        
        type:ObjectID,
        ref: 'Product',
    }]
})

const Wishlist = mongoose.model('wishlist', wishlistSchema)
module.exports = Wishlist;