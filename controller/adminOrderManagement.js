const Userdb = require('./database');
const Product  = require('../models/productModel');
const Category = require('../models/categoryModel');

const mongoose = require('mongoose')
const AddressModel = require('../models/addressModel');
const OrderModel = require('../models/OrderModel');
const wallet = require('../models/walletModel');
const transactions = require('../models/transactionModel');



exports.OrderManagementPageGet = async (req, res) => {
    try {
        const orders = await OrderModel.find().sort({ createdAt: -1 }).populate('user', 'name').exec();
        res.render('AdminOrderManagement', {
            pagetitle: 'Order Management',
            orders
        });
    } catch (err) {
        console.log(err);
    }
}

exports.OrderDelete = async(req,res)=>{
    try{
        const orderId = req.params.orderId;
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(404).json({success:false,message:'It is not an Valid Id'});
             }

        const order = await OrderModel.findById(orderId);
        if(!order){
            return res.status(404).json({success:true,message:'Order Not found in Database'})
        }
        await OrderModel.findByIdAndDelete(orderId);

        res.sendStatus(200);
    }catch(err){
        console.log(err);
        res.status(500).send('Error deleting the order');
    }
}


exports.orderDetailedView = async(req,res)=>{
    try{
        const orderId = req.params.orderId;
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(404).json({success:false,message:'It is not an Valid Id'});
             }

        const order = await OrderModel.findById(orderId);
        if(!order){
            return res.status(404).json({success:false,message:'Order Not found in Database'})
        }

        const orders = await OrderModel.findOne({_id:orderId}).sort({ createdAt: -1 }).populate('user', 'name').exec();
        const userId = orders.user;
        const userDetail = await Userdb.findOne({_id:userId})
        res.render('adminOrderDetailedView', {
            pagetitle: '',
            orders,
            userDetail
        });

    }catch(err){
        console.log(err);
        res.status(500).send('Error deleting the order');
    }
    
}
exports.refundAmount = async(req,res)=>{
    try {
        const {orderId,userId} = req.body;
        const order = await OrderModel.findById(orderId);
        if(!order){
            res.status(404).json({status:false, message:'Orderd not found'})
        }

        const refundRequest = order.requests.forEach((request)=>{
            request.type === 'Cancel' && request.status === 'Pending';
        })

        // Check if there is a 'Pending' return request
        const returnRequest = order.requests.find(request => request.type === 'Return' && request.status === 'Pending');
        if (!refundRequest && !returnRequest) {
            return res.status(400).json({ success: false, message: 'No pending refund or return request found for this order' });
        }

        if(refundRequest){
            refundRequest.status = 'Accepted'
        }

        if(returnRequest){
            returnRequest.status = 'Accepted'
        }

        const user = await Userdb.findById(userId);
        const Wallet = await wallet.findOne({user:userId})
        
        if(!user || !Wallet){
            return res.status(404).json({status:false, message:'User or Wallet not found'})
        }

        Wallet.balance += order.billTotal;

        const userTransactions = await transactions.findOne({userId:userId});

        if(!userTransactions){
            const transaction = new transactions({
                userId:userId,
                transactions:[{
                    transactionType:'credit',
                    amount:order.billTotal,
                    date: new Date(),
                    payment:'Wallet'
                }]
            });
            await transaction.save();
        }else{
            userTransactions.transactions.push({
                transactionType:'credit',
                amount:order.billTotal,
                date: new Date(),
                payment:'Wallet'
            });
            await userTransactions.save();
        }


        await order.save();
        return res.status(200).json({success:true,message:'Amount refund success'})
   
    } catch (error) {
        console.error(error);
        return res.status(500).json({success:false,error:'Internal server Error'})
    }
}






exports.updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const newStatus = req.body.orderStatus;

        if (newStatus === 'Canceled') {
            // If the new order status is 'Canceled,' you should retrieve the order details.
            const canceledOrder = await OrderModel.findById(orderId);

            if (!canceledOrder) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            // loop through the order items and increment the product quantities.
            for (const orderItem of canceledOrder.items) {
                const product = await Product.findById(orderItem.productId);

                if (product) {
                    // Increment the product countInStock based on the quantity in the canceled order.
                    product.countInStock += orderItem.quantity;
                    await product.save();
                }
            }
        }

        // Update the order status.
        const updatedOrder = await OrderModel.findOneAndUpdate(
            { _id: orderId },
            { status: newStatus },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        return res.status(200).json({ success: true, message: 'Order status updated successfully', updatedOrder });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
