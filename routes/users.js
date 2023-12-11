var express = require('express');
var router = express.Router();
const user=require('../controller/usrMiddleware');
const auth=require('../middlewares/auth')
const product=require('../controller/productManagement')
const nocache=require('nocache')
const wish = require('../controller/wishlistController')
router.use(nocache());
const errorHandler = require('../middlewares/errorHandler')


router.get('/',user.isBlocked,auth.isLogin,user.homepage,errorHandler.handle404Error);
router.get('/login',user.loginpage,errorHandler.handle404Error);
router.post('/login',user.loginpost,errorHandler.handle404Error);
router.get('/shop',auth.isLogin,user.isBlocked,user.shopUser,errorHandler.handle404Error);
router.get('/product-detail/:productId',user.isBlocked,user.ProductDetailedView,errorHandler.handle404Error);
router.get('/signup',user.signuppage);
router.post('/signup',user.postRegister,errorHandler.handle404Error);

//wishlist
router.post('/wishlist/:productId',wish.addToWishlist,errorHandler.handle404Error)
router.get('/wishlist',wish.getWishlist,errorHandler.handle404Error);
router.delete('/wishlist/remove/:productId',wish.removeWishlist,errorHandler.handle404Error)

//otp
router.get('/otp',user.loadOTP,errorHandler.handle404Error)
router.post('/resend',user.resendOTP,errorHandler.handle404Error)
router.post('/postotp',user.postVerifyOtp)


//profile routes
router.get('/profile',auth.isLogin,user.isBlocked,user.userProfileGet,errorHandler.handle404Error)
router.post('/profile/addAddress',auth.isLogin,user.isBlocked,user.userAddAddress)
router.post('/profile/editAddress',auth.isLogin,user.isBlocked,user.userEditAddress,errorHandler.handle404Error)

router.delete('/profile/deleteAddress',auth.isLogin,user.isBlocked,user.userdeleteAddress,errorHandler.handle404Error)


router.post('/profile/editProfile',auth.isLogin,user.isBlocked,user.userDetailEdit,errorHandler.handle404Error)

router.get('/order-details/:orderId',auth.isLogin,user.isBlocked,user.userOrderDetails,errorHandler.handle404Error);

router.post('/return-order/:orderId',auth.isLogin,user.isBlocked,user.returnOrder,errorHandler.handle404Error)

router.get('/user-invoice/:orderId',auth.isLogin,user.isBlocked,user.userOrderInvoice,errorHandler.handle404Error)


//order
router.get('/userorders',auth.isLogin,user.isBlocked,user.userOrderGet,errorHandler.handle404Error)

//coupon get

router.post('/coupon-apply',auth.isLogin,user.isBlocked,user.CouponApply,errorHandler.handle404Error);
router.post('/coupon-remove',auth.isLogin,user.isBlocked,user.couponRemove,errorHandler.handle404Error);

router.get('/referral',auth.isLogin,user.isBlocked,user.getReferral,errorHandler.handle404Error)

//reset password

router.get('/profile/change-password',auth.isLogin,user.isBlocked,user.changePassword)

router.get('/reset-password/:tokenId',auth.isLogin,user.isBlocked,user.resetPasswordGET,errorHandler.handle404Error);

router.post('/reset-password',auth.isLogin,user.isBlocked,user.resetPasswordPost,errorHandler.handle404Error);



router.post('/cancel-order/:orderId',auth.isLogin,user.isBlocked,auth.isLogin,user.cancelOrder)

// router.get('/verify',user.verifyMail);
router.get('/logout',user.logout)

module.exports=router;