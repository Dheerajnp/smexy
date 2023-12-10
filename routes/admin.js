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

router.get('/pdf',user.downloadPdf);
router.get('/excel',user.generateExcel);

router.get('/signin',user.admlogin);
router.post('/signin',user.admverify)
router.get('/users',user.adminSideUsersList);
router.post('/users/block-user/:Id',user.adminUserBlock);
router.get('/logout',user.admLogout);

router.get('/transactions',adminTransaction.adminUsersTransactionList);
router.get('/transactiondetails/:userId',adminTransaction.userTransactionDetails)
router.get('/alltransactions',adminTransaction.allTransactions);



router.get('/category-management',category.categoryManagementGet);
router.post('/category-management/newCategory', upload.single('image'),category.categoryManagementCreate)
router.post('/category-management/edit-category/:categoryId',upload.single('editImage'),category.categoryManagementEdit)
router.delete('/category-management/delete-category/:categoryId',category.categoryManagementDelete);



router.get('/product-management',product.productManagementGet)

router.post('/product-management/newProduct',upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images' }]),product.productManagementCreate)

router.get('/product-management/getCategories',product.productCategories);

router.post('/product-management/editProduct/:Id',upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images' }]),product.productManagementEdit);

router.delete('/product-management/delete-product/:productId',product.productManagementDelete);

router.put('/product-management/updateProduct/:productId',product.productManagementPublish);


//category-offer

router.get('/category-offers',user.categoryOffer);
router.post('/category-offers',user.categoryOfferPost)




//coupon management

router.get('/create-coupon',user.couponGet);
router.post('/create-coupon',user.couponPost);
router.delete('/coupon-delete/:couponId',user.couponDelete)
//order
router.get('/order-management',Order.OrderManagementPageGet);
router.delete('/order-management/deleteOder/:orderId',Order.OrderDelete)
router.get('/order-management/orderDetailedView/:orderId',Order.orderDetailedView);
router.post('/order-management/update-order-status/:orderId',Order.updateOrderStatus);
router.post('/order-management/return-order-request',Order.refundAmount)

module.exports = router;
