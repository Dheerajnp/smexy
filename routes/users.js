var express = require('express');
var router = express.Router();
const user=require('../controller/usrMiddleware');
const auth=require('../middlewares/auth')
const product=require('../controller/productManagement')
const nocache=require('nocache')
const {changePassword} = require('../controller/otpSetupController');
const wish = require('../controller/wishlistController')
router.use(nocache());
// router.use(nocache())


router.get('/',user.isBlocked,auth.isLogin,user.homepage);
router.get('/login',user.loginpage);
router.post('/login',user.loginpost);
router.get('/shop',auth.isLogin,user.isBlocked,user.shopUser);
router.get('/product-detail/:productId',user.isBlocked,user.ProductDetailedView);
router.get('/signup',user.signuppage);
router.post('/signup',user.postRegister);

//wishlist
router.post('/wishlist/:productId',wish.addToWishlist)
router.get('/wishlist',wish.getWishlist);
router.delete('/wishlist/remove/:productId',wish.removeWishlist)

//otp
router.get('/otp',user.loadOTP)
router.post('/resend',user.resendOTP)
router.post('/postotp',user.postVerifyOtp)


//profile routes
router.get('/profile',auth.isLogin,user.isBlocked,user.userProfileGet)
router.post('/profile/addAddress',auth.isLogin,user.isBlocked,user.userAddAddress)
router.post('/profile/editAddress',auth.isLogin,user.isBlocked,user.userEditAddress)

router.delete('/profile/deleteAddress',auth.isLogin,user.isBlocked,user.userdeleteAddress)


router.post('/profile/editProfile',auth.isLogin,user.isBlocked,user.userDetailEdit)

router.get('/order-details/:orderId',auth.isLogin,user.isBlocked,user.userOrderDetails);

router.post('/return-order/:orderId',auth.isLogin,user.isBlocked,user.returnOrder)

router.get('/user-invoice/:orderId',auth.isLogin,user.isBlocked,user.userOrderInvoice)


//order
router.get('/userorders',auth.isLogin,user.isBlocked,user.userOrderGet)

//coupon get

router.post('/coupon-apply',auth.isLogin,user.isBlocked,user.CouponApply);
router.post('/coupon-remove',auth.isLogin,user.isBlocked,user.couponRemove);

router.get('/referral',auth.isLogin,user.isBlocked,user.getReferral)

//reset password

router.get('/profile/change-password',auth.isLogin,user.isBlocked,user.changePassword)

router.get('/reset-password/:tokenId',auth.isLogin,user.isBlocked,user.resetPasswordGET);

router.post('/reset-password',auth.isLogin,user.isBlocked,user.resetPasswordPost);



router.post('/cancel-order/:orderId',auth.isLogin,user.isBlocked,auth.isLogin,user.cancelOrder)

// router.get('/verify',user.verifyMail);
router.get('/logout',user.logout)

module.exports=router;