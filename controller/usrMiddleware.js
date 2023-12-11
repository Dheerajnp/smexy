const session = require('express-session');
const ejs = require('ejs');
const Userdb = require('./database');
const puppeteer = require('puppeteer')
const auth = require('../middlewares/auth')
const bcrypt = require('bcryptjs')
const shortid = require('shortid');
const nodemailer = require('nodemailer');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const AddressModel = require('../models/addressModel')
const OrderModel = require('../models/OrderModel');
const walletModel = require('../models/walletModel');
const {Coupon} = require('../models/couponModel')
const transactions = require('../models/transactionModel')
const {
  tp
} = require('../config/otpGenerator');
require('dotenv').config({path:'config.env'});


const isBlocked = async (req, res, next) => {
  if (req.session.email) {
    let user = await Userdb.findById(req.session.email._id)
    if (user.isBlocked) {
      req.session.destroy()
      res.redirect('/login')
    } else {
      next()
    }
  } else {
    res.redirect('/login')
  }
}


let homepage = async (req, res,next) => {
  try {
    // Fetch products from your database
    
      let user = (req.session.email._id) ? true : false
      const products = await Product.find().populate('category', 'name'); //  // You can customize this query as needed
      const category = await Category.find();
      // Render the "UserHome" view and pass the products to it
      res.render('UserHome', {
        products,
        showLogoutButton: true,
        user,
        category
      });
   
  } catch (error) {
    console.error(error);
    res.status(500)
    next();
  }
}



const loginpage = async (req, res,next) => {
  try {
    if (req.session.email) {
      res.redirect('/')
    } else {
      res.render('userlogin')
    }

  } catch (err) {
    // Handle any errors that might occur during rendering
    console.error(err);
    res.status(500);
    next();
  }
};

const loginpost = async (req, res, next) => {
  try {
    const userData = await Userdb.findOne({
      email: req.body.email
    });
    const data = req.body;

    if (userData) {
      const passwordMatch = await bcrypt.compare(data.password, userData.password);
      if (passwordMatch) {

        if (userData.isBlocked) {
          // return res.status(500).json({status:500,message:'You are blocked by administrators '})
          res.render('userlogin', {
            message: 'You are blocked by administrators'
          })
        } else {
          if (userData.isverified) {
            req.session.email = userData;
            res.redirect('/');
          } else {
            res.render('userlogin', {
              message: 'Please verify your email'
            })
          }

        }
      } else {
        // Password does not match
        res.render('userlogin', {
          message: 'Wrong Password'
        });
      }
    } else {
      // User not found
      res.render('userlogin', {
        message: 'User not found please signup if not registered'
      });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500);
    next();
  }
};

const loadOTP = async (req, res, next) => {
  try {
    res.render('otp',{err:""})
  } catch (error) {
    console.log(error.message);
    res.status(500);
    next();
  }
}
  

async function resendOTP(req, res, next) {
    try {
      const { email } = req.session.user;
      const user = req.session.otp;
  
      if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/otp");
      }
  
      // Calculate the new expiration time
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 5);
  
      // Send the new OTP email
      const result = await sendOtpVerificationEmail(email);
      
      // Update the OTP and its expiration time in the session
      user.code = result.data.otp;
      user.expiresat = expirationTime;
      req.session.otp = user;
      // Redirect the user to the OTP verification page
      res.redirect('/otp');
    } catch (error) {
      console.log(error.message);
      res.status(500);
      next();
    }
  };
  



const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10); // Add await here
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
}

//for send mail


const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS
  }


})

const sendOtpVerificationEmail = async (email) => {
  try {
    const otp = Math.floor(1000 + Math.random() * 9000);

    const mailOptions = {
      from: "dheerajpradi@gmail.com",
      to: email,
      subject: "Verify your Email",
      html: `Your OTP is: ${otp}`, 
    }

    // Send the email
    await transporter.sendMail(mailOptions);

    return {
      status: "PENDING",
      message: "Verification OTP email sent",
      data: {
        email: email,
        // hashedotp: hashedotp, // Send the hashed OTP for verification
        otp,
      },
    };
  } catch (error) {
    throw error;
  }
};

function generateReferralCode() {
  return shortid.generate();
}

async function postRegister(req, res, next) {
  const {
    name,
    email,
    mobile,
    password,
    referral
  } = req.body;

  try {
    let user = await Userdb.findOne({
      email
    });

    if (user) {
      return res.redirect("/login");
    }

    const ref = await Userdb.findOne({referralcode:referral})
    if(ref){
      req.session.referral = ref;
    }


    // Calculate the expiration time
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 5);

    // Send the OTP email
    const result = await sendOtpVerificationEmail(email);
    let otp = {
      code: result.data.otp,
        expiresat: expirationTime,
    }

    const hashedPsw = await securePassword(password);
    // Store the OTP and its expiration time in the database
    user = {
      name,
      email,
      mobile,
      password: hashedPsw,
      admin: false,
      isverified: false,
      isBlocked: false,
      referralcode:generateReferralCode(),
    }

    // Save the new user to the database
    // await user.save();


    //put the userdata in session
    req.session.otp = otp;
    req.session.userDetails = user;

    // Set the user data in the session
    req.session.user = {
      _id: user._id,
      email: user.email,
      admin: user.is_admin,
    };

    // Redirect the user to the OTP verification page
    res.redirect('/otp');
  } catch (error) {
    res.status(500);
    next();
  }
}


async function postVerifyOtp(req, res, next) {
  try {
    const {
      otp
    } = req.body;
    const {
      email
    } = req.session.user;
    // const user = await Userdb.findOne({
    //   email
    // });
    let user = req.session.userDetails;
    const otpverify = req.session.otp;
    console.log(otp,otpverify.code)
    
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/otp");
    }
    // Check if the OTP is expired
    if (new Date() > otpverify.expiresat) {
      req.flash("error", "OTP has expired");
      return res.redirect("/verifyOtp");
    }

    // Compare the entered OTP with the stored OTP code
    if (otp == otpverify.code) {
      console.log("scvkbvjkcbjbvf")
      user.isverified = true;
      let response = await Userdb.insertMany([req.session.userDetails])
      let userdata = await Userdb.findOne({email:user.email})
      const wallet = new walletModel({
        user: userdata._id
      });
      await wallet.save();
      if(req.session.referral){
        const referringId = await Userdb.findById(req.session.referral._id);
        const newWallet = await walletModel.findOne({user:userdata._id});
        const refWallet = await walletModel.findOne({user:req.session.referral._id});
        refWallet.balance+=100;
        newWallet.balance+=100;
        refWallet.save();
        newWallet.save();
        const newtrans = new transactions({
          userId:userdata._id,
          transactions:[{
            transactionType:"credit",
            amount:100,
            date: new Date(),
            payment: "Wallet",
            description:"Referral bonus(new user)"
          }]
        })
        await newtrans.save();
        const userTransactions = await transactions.findOne({userId:req.session.referral._id});
        if(!userTransactions){
            var transaction = new transactions({
              userId:req.session.referral._id,
              transactions:[{
                transactionType:"credit",
                amount:100,
                date: new Date(),
                payment: "Wallet",
                description:"Referral bonus(Invite bonus)"
              }]
            })
            await transaction.save();

        }else{
          userTransactions.transactions.push({
            transactionType:"credit",
            amount:100,
            date: new Date(),
            payment: "Wallet",
            description:"Referral bonus(Invite bonus)"
          })

          await userTransactions.save();
        }
          
      }
      req.session.userDetails = null;
      req.session.otp = null;
      res.redirect('/login')
    } else {
      res.render('otp',{err:"Enter the correct otp"})
    }
  } catch (error) {
    //   req.flash("error", error.message);
    res.redirect("/otp");
  }
}

let signuppage = (req, res, next) => {
  res.render('signup')
}






const shopUser = async (req, res, next) => {
  try {
    let user = (req.session.email._id) ? true : false
    const itemsPerPage = 6;
    const selectedPage = req.query.page || 1;
    const selectedCategory = req.query.category || null;
    const selectedSort = req.query.sort || 'priceLowToHigh';
    const searchQuery = req.query.search || '';
    let query = {
      isFeatured: true, 
      $or: [{
          name: {
            $regex: searchQuery,
            $options: 'i'
          }
        },
        {
          brand: {
            $regex: searchQuery,
            $options: 'i'
          }
        },
      ],
    };

    // Fetch products based on filters
    let products = Product.find(query).populate('category', 'name');

    if (selectedCategory) {
      products = products.where('category').equals(selectedCategory);
    }

    // Execute the query to fetch products
    products = await products.exec();

    // Apply sorting based on the selected criteria
    if (selectedSort === 'priceLowToHigh') {
      products = products.sort((a, b) => a.price - b.price);
    } else if (selectedSort === 'priceHighToLow') {
      products = products.sort((a, b) => b.price - a.price);
    } else if (selectedSort === 'releaseDate') {
      // Sort products by release date (you'll need to specify the date property)
      products = products.sort((a, b) => a.releaseDate - b.releaseDate);
    } else if (selectedSort === 'avgRating') {
      // Sort products by average rating (you'll need to specify the rating property)
      products = products.sort((a, b) => b.avgRating - a.avgRating);
    }

    // Your pagination logic to get a subset of products based on selectedPage
    const startIndex = (selectedPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const paginatedProducts = products.slice(startIndex, endIndex);
    const totalProducts = products.length;

    const newProducts = await Product.find({
      isFeatured: true
    }).sort({
      createdAt: -1
    }).limit(3);

    const category = await Category.find();
    let productInWishlist = {};

    if (user) {
      const userId = req.session.email._id;
  
      const wishlist = await Wishlist.findOne({ userId: userId });

      paginatedProducts.forEach((product) => {
        productInWishlist[product._id] = wishlist?.products.includes(product._id) || false;
      });
    } 

    res.render('UserShop', {
      user,
      products: paginatedProducts,
      newProducts,
      category,
      currentPage: selectedPage,
      totalPages: Math.ceil(totalProducts / itemsPerPage),
      countProducts: totalProducts,
      sort: selectedSort,
      selectedCategory: selectedCategory,
      productInWishlist:productInWishlist
    });
  } catch (err) {
    console.log(err);
    res.status(500);
    next();
  }
} 


const ProductDetailedView = async (req, res, next) => {
  try {

    const id = req.params.productId;

    if (isObjectIdOrHexString(id)) {
      const product = await Product.findById(id);
      const category = await Category.find();

      if (!product) {
        // Handle the case where the product with the specified id is not found
        return res.status(404).json({
          error: 'Product not found'
        });
      }
      let wishDetails = await Wishlist.findOne({userId:req.session.email._id});

      var Result;
      if(!wishDetails){
        Result=false
      }else{
        const productIndex = wishDetails.products.indexOf(product._id);
       
        if (productIndex !== -1) {
           Result=true;
         
        } else {
           Result=false;
        }
      }
      let user = (req.session.email) ? true : false
      // Render a template to display the product details
      res.render('ProductDetailedView', {
        product,
        user,
        category,
        productInWishlist:Result,
      });
    } else {
      res.redirect('/shop')
    }

  } catch (error) {
    console.error(error);
    res.status(500);
    next();
  }
}



//profile 
const userProfileGet = async (req, res, next) => {
  try {
    let user = (req.session.email._id) ? true : false
    const category = await Category.find({
      status: 'active'
    });
    const addresses = await AddressModel.findOne({
      user: (req.session.email._id)
    })
    const userDetails = await Userdb.findOne({
      _id: (req.session.email._id)
    })
    const orderDetails = await OrderModel.find({
      user: req.session.email._id
    })
    const limit = 5;

    const walletData = await walletModel.findOne({user:req.session.email._id});
  

// Find transactions with userId and payment as "Wallet"
let walletTransactions = await transactions.findOne({ userId: req.session.email._id, 'transactions.payment': 'Wallet' });
if (walletTransactions && walletTransactions.transactions) {
  walletTransactions = walletTransactions.transactions.reverse();
} else {
  walletTransactions = []; // Assign an empty array when walletTransactions or its transactions property is null
}

    const totalorders = await OrderModel.countDocuments({user: req.session.email._id});
    const orders = await OrderModel.find({
      user: req.session.email._id
    }).sort({
      orderDate: -1
}).limit(limit);
    // const totalPages = Math.ceil(totalorders / limit)
    res.status(200).render('userProfile', {
      category,
      user,
      addresses,
      userDetails,
      orderDetails: orders,
      category,
      walletData,
      walletTransactions,
      totalorders
    })

  } catch (err) {
    console.log(err);
    res.status(500);
    next();
  }
}

const userAddAddress = async (req, res, next) => {
  try {
    // Get the address data from the request body
    const {
      addressType,
      houseNo,
      street,
      landmark,
      pincode,
      city,
      district,
      state,
      country
    } = req.body;

    const userId = req.session.email._id; // You can get the user's ID from the cookie or authentication system

    // Check if the user exists
    const user = await Userdb.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find the user's address document
    let useraddresses = await AddressModel.findOne({
      user: userId
    });

    if (!useraddresses) {
      // If the useraddresses document doesn't exist, create a new one
      useraddresses = new AddressModel({
        user: userId,
        addresses: []
      });
    }

    // Check if the address already exists for the user
    const existingAddress = useraddresses.addresses.find((address) =>
      address.addressType === addressType &&
      address.HouseNo === houseNo &&
      address.Street === street &&
      address.pincode === pincode &&
      address.city === city &&
      address.State === state &&
      address.Country === country
    );

    if (existingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Address already exists for this user'
      });
    }

    if (useraddresses.addresses.length >= 3) {
      return res.status(400).json({
        success: false,
        message: 'User cannot have more than 3 addresses',
      });
    }

    // Create a new address object
    const newAddress = {
      addressType: addressType,
      HouseNo: houseNo,
      Street: street,
      Landmark: landmark,
      pincode: pincode,
      city: city,
      district: district,
      State: state,
      Country: country,
    };

    useraddresses.addresses.push(newAddress);

    // Save the updated address document
    await useraddresses.save();

    // Respond with a success message
    res.status(200).json({
      status: true,
      message: 'Address added successfully'
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      // Handle validation errors
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: err.errors
      });
    } else {
      console.log(err);
      res.status(500).render('500error', {
        success: false,
        message: 'Internal Server Error'
      });
    }
  }
};

const userEditAddress = async (req, res, next) => {
  try {
    const {
      addressType,
      HouseNo,
      Street,
      Landmark,
      pincode,
      city,
      district,
      state,
      Country
    } = req.body;

    const userId = req.session.email._id;

    const user = await Userdb.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    const addresses = await AddressModel.findOne({
      user: userId
    })

    if (!addresses) {
      return res.status(404).json({
        success: false,
        message: 'Addresses not found'
      });
    }

    // Find the address you want to edit based on the provided address type
    const addressToEdit = addresses.addresses.find(addr => addr.addressType === addressType);

    if (!addressToEdit) {
      return res.status(404).json({
        success: false,
        message: `Address with type '${addressType}' not found`
      });
    }

    // Update the address details
    addressToEdit.HouseNo = HouseNo;
    addressToEdit.Street = Street;
    addressToEdit.Landmark = Landmark;
    addressToEdit.pincode = pincode;
    addressToEdit.city = city;
    addressToEdit.district = district;
    addressToEdit.State = state;
    addressToEdit.Country = Country;

    // Save the updated address
    await addresses.save();

    res.status(200).redirect('/profile');

  } catch (err) {
    console.error(err);
    res.status(500);
    next();
  }
}

const userdeleteAddress = async (req, res) => {
  try {
    const userId = req.session.email._id;

    const user = await Userdb.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    const addresses = await AddressModel.findOne({
      user: userId
    })

    if (!addresses) {
      return res.status(404).json({
        success: false,
        message: 'Addresses not found'
      });
    }

    const addressTypeToDelete = req.query.addressType; // Get the addressType to delete from the query parameter
    // Find the index of the address with the provided addressType
    const addressIndexToDelete = addresses.addresses.findIndex((address) => address.addressType === addressTypeToDelete);

    if (addressIndexToDelete === -1) {
      return res.status(404).json({
        success: false,
        message: `Address with type '${addressTypeToDelete}' not found`
      });
    }
    // Remove the address with the specified addressType
    addresses.addresses.splice(addressIndexToDelete, 1);

    await addresses.save();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (err) {
    res.status(500);
    next();
  }
}

const userDetailEdit = async (req, res) => {
  try {
    const {
      firstName,
      email,
      gender,
      mobile
    } = req.body; // Update this based on your form field names
    // 2. Perform data validation if needed
    if (!firstName || !email || !gender || !mobile) {
      return res.status(400).json({
        error: 'All fields are required.'
      });
    }
    const userId = req.session.email._id;

    const user = await Userdb.findById(userId); // Replace with your own logic to retrieve the user
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Authentication is Required'
      })
    }

    user.firstName = firstName;
    user.email = email;
    user.gender = gender;
    user.mobile = mobile;
    await user.save();
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    console.log(err);
    res.status(500);
    next()
  }
}

const userOrderDetails = async (req, res) => {
  try {
    const user = req.session.email._id ? true : false;
    const orderId = req.params.orderId;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(404).json({
        success: false,
        message: 'It is not an Valid Id'
      });
    }
    // Implement logic to delete the order by its ID from the database
    // You should also add error handling as needed
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order Not found in Database'
      })
    }
    const category = await Category.find();
    const orders = await OrderModel.findOne({
      _id: orderId
    }).sort({
      createdAt: -1
    }).populate('user', 'name').exec();
    const userId = orders.user;
    const userDetail = await Userdb.findOne({
      _id: userId
    })
    res.render('orderDetails', {
      pagetitle: '',
      order: orders,
      userDetail,
      user,
      category
    });

  } catch (error) {
    console.log(err);
    res.status(500);
    next();
  }
}

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Check if the order exists
    const order = await OrderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found"
      });
    }

    // Retrieve the products associated with the canceled order
    const canceledProducts = order.items;

    // Increase stock counts for each canceled product
    for (const product of canceledProducts) {
      const productId = product.productId;
      const quantity = product.quantity;



      if(order.paymentMethod==="Razorpay"){
        
              let refundAmount=order.billTotal;
               // Find or create a wallet document for the user
                        // Find or create a wallet document for the user
              let wallet = await walletModel
              .findOneAndUpdate({ user: req.session.email._id }, {}, { upsert: true, new: true }).populate('transactions'); // Populate the 'transactions' field
                          
              // Update the wallet balance with the refund amount
              wallet.balance = wallet.balance + refundAmount;
                          
              const userTransactions = await transactions.findOne({userId:req.session.email._id});
              if(!userTransactions){
                  var transaction = new transactions({
                    userId:req.session.email._id,
                    transactions:[{
                      transactionType:"credit",
                      amount:order.billTotal,
                      date: new Date(),
                      payment: "Razorpay"
                    }]
                  })
                  await transaction.save();

              }else{
                userTransactions.transactions.push({
                  transactionType:"credit",
                  amount:order.billTotal,
                  date: new Date(),
                  payment: "Razorpay"
                })

                await userTransactions.save();
              }
                          
            

              // Push the transaction reference into the wallet's transactions array
              wallet.transactions.push(transaction);

              // Save the wallet document
              await wallet.save();
              

      }else if(order.paymentMethod==="Wallet"){
        
        let refundAmount=order.billTotal;
         // Find or create a wallet document for the user
                  // Find or create a wallet document for the user
        let wallet = await walletModel
        .findOneAndUpdate({ user: req.session.email._id }, {}, { upsert: true, new: true }).populate('transactions'); // Populate the 'transactions' field
                    
        // Update the wallet balance with the refund amount
        wallet.balance = wallet.balance + refundAmount;
        await wallet.save();
                    
        const userTransactions = await transactions.findOne({userId:req.session.email._id});

        if(!userTransactions){
            var transaction = new transactions({
              userId:req.session.email._id,
              transactions:[{
                transactionType:"credit",
                amount:order.billTotal,
                date: new Date(),
                payment: "Wallet"
              }]
            })
            await transaction.save();

        }else{
          userTransactions.transactions.push({
            transactionType:"credit",
            amount:order.billTotal,
            date: new Date(),
            payment: "Wallet"
          })

          await userTransactions.save();
        }
                    
                    
      

        // Push the transaction reference into the wallet's transactions array
        wallet.transactions.push(transaction);

        // Save the wallet document
        await wallet.save();
        

}
      // Find the product in your database
      const productToUpdate = await Product.findById(productId);

      if (!productToUpdate) {
        return res.status(404).json({
          success: false,
          error: "Product not found for restocking",
        });
      }

      // Increase the stock count
      productToUpdate.countInStock += quantity;

      // Save the updated product
      await productToUpdate.save();
    }

    // Mark the order as "Canceled" and save it
    order.status = "Canceled";
    await order.save();

    return res.json({
      success: true,
      message: "Order canceled successfully"
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};


const resetPasswordGET = async (req, res) => {
  try {
    let user = (req.session.email._id) ? true : false

    const Token = req.params.tokenId;
    if (!Token) {
      return res.status(404).json({
        message: 'token not found'
      });
    }
    const User = await Userdb.findOne({
      resetToken: Token
    });
    if (!User) {
      return res.status(404).render('errorHandler')

    }
    if (User.resetTokenExpiration && User.resetTokenExpiration > new Date()) {
      // The token is still valid
      // Perform your reset password logic
      // const category = await Category.find({status:'active'});
      return res.render('userSetNewPassword', {
        user,
        Token
      })
    } else {
      // The token has expired
      // Handle the case where the token has expired
      return res.status(410).json({
        message: 'The token is expired'
      })
    }

  } catch (error) {
    console.error(error);
    res.status(500);
    next();
  }
}


const resetPasswordPost = async (req, res) => {
  try {
    const token = req.body.token;
    const password = req.body.newPassword;
    const confirm_password = req.body.confirmnewPassword;
    if (password !== confirm_password) {
      return res.status(400).json({
        message: 'The confirm password and  password must be same'
      })
    }
    const user = await Userdb.findOne({
      resetToken: token
    });
    if (!user) {
      return res.status(404).render('errorHandler')

    }
    user.password = password;
    user.resetToken = null; // Optionally, clear the reset token
    user.resetTokenExpiration = null;
    await user.save();
    // return res.status(200).json({status:true,message: 'Password reset successful' });
    return res.status(200).json({
      success: true,
      message: 'Sucesfully Password Changed'
    })
  } catch (error) {
    console.error(error);
    res.status(500);
    next();
  }

}


const crypto = require('crypto');
const {
  default: mongoose,
  isObjectIdOrHexString
} = require('mongoose');
const {
  log
} = require('console');
const path = require('path');
const Wishlist = require('../models/wishlistModel');
const wallet = require('../models/walletModel');

const changePassword = async (req, res) => {
  try {
    let user = (req.session.email._id) ? true : false
    const userId = req.session.email._id
    const userDetails = await Userdb.findOne({
      _id: userId
    });
    if (!userDetails) {
      return res.status(404).json({
        message: 'User is not found'
      });
    }
    const email = userDetails.email;
    const token = crypto.randomBytes(32).toString('hex');
    const updatedUser = await Userdb.findByIdAndUpdate(
      userId, {
        $set: {
          resetToken: token,
          resetTokenExpiration: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes in milliseconds
        },
      }
    );

    if (!updatedUser) {
      return res.status(500).json({
        message: 'Failed to update user data'
      });
    }

    const mailOptions = {
      to: email,
      subject: 'Password Reset Request',
      text: `Click the following link to reset your password: http://localhost:4000/reset-password/${token}`,
      html: `<p>Click the following link to reset your password:</p><p><a href="http://localhost:4000/reset-password/${token}">http://localhost:4000/reset-password/${token}</a></p>`,
    };

    await tp.sendMail(mailOptions);

    return res.status(201).json({
      message: 'Reset password link is sent successfully'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: `INTERNAL SERVER ERROR ${err}`
    });
  }
}

const returnOrder = async (req, res) => {
  try {
      const { orderId } = req.params;
      const reason = req.body.ReasonValue

      // Assuming your order model is used for database operations
      const order = await OrderModel.findById(orderId);

     
      // const canceledproducts = order.items
      if (!order) {
          return res.status(404).render('page-not-found');
      }
      order.status = 'Return';
      order.requests.push({
        type:'Return',
        status:'Pending',
        reason:reason
      })
      await order.save()
      res.status(200).json({success : true})
    
  } catch (error) {
      console.log(error.message);
      res.status(500);
      next();
  }
};


let logout = (req, res, next) => {
  req.session.email = false;
  console.log("Session destroyed");
  res.redirect('/login')
}


const userOrderInvoice = (req, res) => {
  const userId = req.session.email._id;
  const orderId = req.params.orderId; // Extract the orderId from req.params

  try {
    (async () => {
      const order = await OrderModel.findById(orderId).populate('user', 'name');
      
      if (!order) {
        return res.status(404).send('Order not found');
      }

      ejs.renderFile(path.join(__dirname,'..', '/views/templates/invoice.ejs'), { order }, (err, htmlContent) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error rendering the PDF');
        }

        (async () => {
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.setContent(htmlContent);

          const pdfPath = path.join(__dirname, '..', 'assets', `${userId}_order.pdf`);
          await page.pdf({ path: pdfPath, format: 'A4' });

          await browser.close();

          res.setHeader('Content-Disposition', `attachment; filename="${userId}_order.pdf"`);
          res.setHeader('Content-Type', 'application/pdf');
          res.sendFile(pdfPath);
        })();
      });
    })();
  } catch (err) {
    console.error(err);
    res.status(500);
    next();
  }
};


const CouponApply = async (req, res) => {
  try {
    const couponCode = req.body.couponData;

    const coupon = await Coupon.findOne({
      couponCode: couponCode
    })

    if (coupon) {
      req.session.coupon = coupon;
      res.status(200).json({
        success: true,
        couponName:coupon.couponCode
      })
    } else {
      req.session.discountedTotal = 0;
      res.status(401).json({
        success: false,
        message:"Coupon not found"
      })
    }

  } catch (error) {
    console.log(error.message);
    res.status(500);
    next();
  }
}

const couponRemove = (req, res) => {
  try {
    if (req.session.coupon) {
      req.session.coupon = null; // Clearing the coupon session
      res.status(200).json({ success: true, message: 'Coupon removed successfully' });
    } else {
      res.status(400).json({ success: false, message: 'No coupon to remove' });
    }
  } catch (error) {
    console.error(error);
    res.status(500);
    next();
  }
};

const userOrderGet = async(req,res)=>{
  try {
    let user = (req.session.email._id) ? true : false;
    const category = await Category.find({
      status: 'active'
    });
    if (req.query.page) {
      page = parseInt(req.query.page);
    } else {
      page = 1;
    }
    const limit = 5;
    const skip = (page - 1) * limit

    
    const totalorders = await OrderModel.countDocuments({user: req.session.email._id});
    const orders = await OrderModel.find().sort({orderDate: -1}).skip(skip).limit(limit);
    const totalPages = Math.ceil(totalorders / limit)
    res.render('userOrdersList',{
      category,
      user,
      orderDetails: orders,
      currentPage: page,
      totalPages,
    })
  } catch (error) {
    console.error(error);
    res.status(500);
    next();
  }
}

const getReferral = async(req,res,next)=>{
  try {
    const user = await Userdb.findOne({_id:req.session.email._id});
    const category = await Category.find({status:'Active'})
    res.render('referral',{
      user,
      category
    })
    
  } catch (error) {
    res.status(500);
    next();
  }
}

module.exports = {
  isBlocked,
  loginpage,
  signuppage,
  homepage,
  loginpost,
  logout,
  shopUser,
  ProductDetailedView,
  securePassword,
  sendOtpVerificationEmail,
  postRegister,
  postVerifyOtp,
  loadOTP,
  resendOTP,
  userProfileGet,
  userAddAddress,
  userEditAddress,
  userdeleteAddress,
  userDetailEdit,
  cancelOrder,
  userOrderInvoice,
  resetPasswordPost,
  resetPasswordGET,
  changePassword,
  userOrderDetails,
  returnOrder,
  CouponApply,
  couponRemove,
  userOrderGet,
  getReferral
}