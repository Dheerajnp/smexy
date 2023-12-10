const mongoose = require('mongoose')
const Userdb = require('../controller/database');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Cart = require('../models/cartSchema');
const Wishlist = require('../models/wishlistModel');
const { ObjectId } = require('mongodb');



let addToWishlist =  async (req, res) => {
    try {
        if(req.session.email){
            const productId = req.params.productId;
            const userId = req.session.email._id;
              
            // Find the product by its ID
            const product = await Product.findOne({ _id: productId });
            if (!product) {
              return res.status(404).json({ message: 'The Product is Not Found' });
            }
        
            // Check if the product is already in the user's wishlist
            const wishlist = await Wishlist.findOne({ userId: userId });
        
            if (!wishlist) {
              // If the wishlist doesn't exist for the user, create a new one
              const newWishlist = new Wishlist({
                  userId: userId,
                products: [productId],
              });
              await newWishlist.save();
              res.status(200).json({ message: 'Product added to wishlist successfully' });
            } else {
              // Check if the product is already in the wishlist
              const productIndex = wishlist.products.indexOf(productId);
        
              if (productIndex !== -1) {
                // If the product is in the wishlist, remove it
                wishlist.products.splice(productIndex, 1);
                await wishlist.save();
                res.status(200).json({ message: 'Product removed from wishlist successfully' });
              } else {
                // If the product is not in the wishlist, add it
                wishlist.products.push(productId);
                await wishlist.save();
                res.status(200).json({ message: 'Product added to wishlist successfully' });
              }
            }
        }else{
            return res.status(401).json({ message: 'Need to login to proceed' });
        }
    
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };


  let getWishlist= async (req,res)=>{

    let userId = req.session.email._id;
    let user = (userId) ? true : false;
    const category = await Category.find();

    

    let wishData = await Wishlist.findOne({userId:userId});
    if(wishData){
        wishData.productData = []
        for(const id of wishData.products) {
            wishData.productData.push(await Product.findOne({_id:id}))
        }
    }
 
    return res.render('wishlist', {
        user,
        category,
        wishlist:wishData,
    }) 


  }

  let removeWishlist = async (req, res, next) => {
    try {
        const productId = req.params.productId; 
        const userId = req.session.email._id;
        const wishlist = await Wishlist.findOne({ userId: userId }).populate('products');
         const productIndex = wishlist.products.findIndex((item) => item._id.toString() === productId)
         if (productIndex === -1) {
             return res.status(404).json({ message: 'Product not found in the wishlist' });
         }

         // Remove the product from the wishlist's products array
         wishlist.products.splice(productIndex, 1);

         // Save the updated wishlist
         await wishlist.save();

         return res.status(200).json({ message: 'Product removed from the wishlist successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


module.exports={
    addToWishlist,
    getWishlist,
    removeWishlist
}