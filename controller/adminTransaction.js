const Userdb = require('./database');
const Product  = require('../models/productModel');
const Category = require('../models/categoryModel');

const mongoose = require('mongoose')
const AddressModel = require('../models/addressModel');
const OrderModel = require('../models/OrderModel');
const wallet = require('../models/walletModel');
const transactions = require('../models/transactionModel');



const adminUsersTransactionList = async(req,res)=>{
    let query={}
    let searchQuery = req.query.search;
    try{
    if(searchQuery){
      query= {
        $or:[
          {name:{ $regex: searchQuery, $options:'i'} },
          { email: { $regex: searchQuery, $options: 'i' } }
        ],
      };
    }
    if(req.query.page){
      page=parseInt(req.query.page);
    }else{
      page= 1 ;
    }
    const limit = 5;
    const skip = (page-1)*limit
    
   
      const total = await Userdb.countDocuments(query);
  
    const users = await Userdb.find(query).skip(skip)
    .limit(limit);
    const totalPages = Math.ceil(total/limit);
  
    res.render('userTransactionList',{ users ,currentPage:page,totalPages,pagetitle:"Users"});
  
    }catch(err){
      console.error("Error fetching users:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  
  }

  let userTransactionDetails = async (req, res) => {
    let user = req.params.userId;
    let searchQuery = req.query.search;
    let page = req.query.page ? parseInt(req.query.page) : 1;

    const limit = 5;
    const skip = (page - 1) * limit;

    try {
        let query = { userId: user };

        if (searchQuery) {
            query['transactions'] = {
                $elemMatch: {
                    $or: [
                        { transactionType: { $regex: searchQuery, $options: 'i' } },
                        { payment: { $regex: searchQuery, $options: 'i' } },
                    ],
                },
            };
        }
        const totTransactions = await transactions.findOne(query);
        if (!totTransactions || !totTransactions.transactions) {
            return res.render('userTransactionDetails', {
                userTransactions: null,
                user: null,
                currentPage: page,
                totalPages: 0,
                pagetitle: "User Transactions"
            });
        }
        const userTransactionsData = await transactions.findOne(query, { transactions: { $slice: [skip, limit] } });

        const userInfo = await Userdb.findById(user);
        if (!userInfo) {
            return res.status(401).json({ status: false, message: "User not found" });
        }

        const totalTransactions = totTransactions.transactions.length;

        const totalPages = Math.ceil(totalTransactions / limit);

        res.render('userTransactionDetails', {
            userTransactions: userTransactionsData,
            user: userInfo,
            currentPage: page,
            totalPages,
            pagetitle: "User Transactions"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: "Server error" });
    }
};



const allTransactions = async(req,res)=>{
  try {
    let page = parseInt(req.query.page) || 1; // get the current page number
    let limit = 10; // set the limit of items per page
    let skip = (page - 1) * limit; // calculate the number of documents to skip

    // calculate the total number of pages
    let totalTransactions = await transactions.countDocuments();
    let totalPages = Math.ceil(totalTransactions / limit);

    const allTransactions  = await transactions.aggregate([
      {
        $lookup: {
          from: 'users', // name of the users collection
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$transactions'
      },
      {
        $project: {
          _id: 0,
          transactionType: '$transactions.transactionType',
          amount: '$transactions.amount',
          date: '$transactions.date',
          payment: '$transactions.payment',
          userName: '$userDetails.name',
          userEmail: '$userDetails.email',
          userMobile: '$userDetails.mobile'
        }
      },
      { $skip: skip }, // skip documents
      { $limit: limit } // limit the results
    ]);

    res.render('adminAllTransactions',{
      allTransactions,
      currentPage: page,
      totalPages: totalPages
    })
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Error retrieving transactions.');
  }
}


  module.exports = {adminUsersTransactionList,userTransactionDetails,allTransactions}