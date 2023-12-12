var express = require('express');
var router = express.Router();
const user=require('../controller/adminMiddleware');
const product=require('../controller/productManagement')
const {storage , upload} = require('../utils/multerConfig')
const Order=require('../controller/adminOrderManagement')
const adminAuth=require('../middlewares/adminAuth')
const nocache=require('nocache')
// router.use(nocache());
router.use(nocache());

const category  =require('../controller/categoryController')
const adminTransaction = require('../controller/adminTransaction')


router.get('/',adminAuth.isAdminLogin,user.dashboard);

//sales report

router.get('/pdf',adminAuth.isAdminLogin,user.downloadPdf);
router.get('/excel',adminAuth.isAdminLogin,user.generateExcel);

router.get('/signin',user.admlogin);
router.post('/signin',user.admverify)
router.get('/users',adminAuth.isAdminLogin,user.adminSideUsersList);
router.post('/users/block-user/:Id',adminAuth.isAdminLogin,user.adminUserBlock);
router.get('/logout',user.admLogout);

router.get('/transactions',adminAuth.isAdminLogin,adminTransaction.adminUsersTransactionList);
router.get('/transactiondetails/:userId',adminAuth.isAdminLogin,adminTransaction.userTransactionDetails)
router.get('/alltransactions',adminAuth.isAdminLogin,adminTransaction.allTransactions);



router.get('/category-management',adminAuth.isAdminLogin,category.categoryManagementGet);
router.post('/category-management/newCategory',adminAuth.isAdminLogin, upload.single('image'),category.categoryManagementCreate)
router.post('/category-management/edit-category/:categoryId',adminAuth.isAdminLogin, upload.single('editImage'),category.categoryManagementEdit)
router.delete('/category-management/delete-category/:categoryId',adminAuth.isAdminLogin,category.categoryManagementDelete);



router.get('/product-management',adminAuth.isAdminLogin,product.productManagementGet)

router.post('/product-management/newProduct',adminAuth.isAdminLogin,upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images' }]),product.productManagementCreate)

router.get('/product-management/getCategories',adminAuth.isAdminLogin,product.productCategories);

router.post('/product-management/editProduct/:Id',adminAuth.isAdminLogin,upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images' }]),product.productManagementEdit);

router.delete('/product-management/delete-product/:productId',adminAuth.isAdminLogin,product.productManagementDelete);

router.put('/product-management/updateProduct/:productId',adminAuth.isAdminLogin,product.productManagementPublish);


//category-offer

router.get('/category-offers',adminAuth.isAdminLogin,user.categoryOffer);
router.post('/category-offers',adminAuth.isAdminLogin,user.categoryOfferPost)




//coupon management

router.get('/create-coupon',adminAuth.isAdminLogin,user.couponGet);
router.post('/create-coupon',adminAuth.isAdminLogin,user.couponPost);
router.delete('/coupon-delete/:couponId',adminAuth.isAdminLogin,user.couponDelete)
//order
router.get('/order-management',adminAuth.isAdminLogin,Order.OrderManagementPageGet);
router.delete('/order-management/deleteOder/:orderId',Order.OrderDelete)
router.get('/order-management/orderDetailedView/:orderId',adminAuth.isAdminLogin,Order.orderDetailedView);
router.post('/order-management/update-order-status/:orderId',adminAuth.isAdminLogin,Order.updateOrderStatus);
router.post('/order-management/return-order-request',adminAuth.isAdminLogin,Order.refundAmount)

module.exports = router;
