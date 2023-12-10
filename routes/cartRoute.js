const express = require('express');
const cartRouter = express.Router();
const user=require('../controller/usrMiddleware');
const auth=require('../middlewares/auth')
require('dotenv').config();


const nocache=require('nocache')

cartRouter.use(nocache());


const cartController = require('../controller/cartController')

//cart

cartRouter.get('/',auth.isLogin,user.isBlocked,cartController.cartGet);

cartRouter.post('/addToCart/:productId',auth.isLogin,user.isBlocked,cartController.cartAdd);

cartRouter.post('/update-cart-quantity',auth.isLogin,user.isBlocked,cartController.cartPut)

cartRouter.post('/remove-product',auth.isLogin,user.isBlocked,cartController.cartRemove)

cartRouter.get('/checkVerify',auth.isLogin,user.isBlocked,cartController.checkverify)


cartRouter.post('/wishlistToCart/:productId',auth.isLogin,user.isBlocked,cartController.wishlistTocart)

//checkout
cartRouter.get('/checkout',auth.isLogin,user.isBlocked,cartController.checkoutGet)

cartRouter.post('/checkout',auth.isLogin,user.isBlocked,cartController.checkoutPost);

cartRouter.post('/verify-payment',auth.isLogin,user.isBlocked,cartController.razorpayVerify)

cartRouter.get('/order-confirmation/:orderId',auth.isLogin,user.isBlocked,cartController.orderConfirmation)

module.exports=cartRouter;