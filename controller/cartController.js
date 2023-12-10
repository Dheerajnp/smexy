const mongoose = require('mongoose')
const Userdb = require('../controller/database');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Cart = require('../models/cartSchema');
const AddressModel = require('../models/addressModel');
const OrderModel = require('../models/OrderModel');
const dotenv = require('dotenv');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const transactionModel = require('../models/transactionModel');
const transactions = require('../models/transactionModel');
const wallet = require('../models/walletModel');
const {
  Coupon
} = require('../models/couponModel');
const Wishlist = require('../models/wishlistModel');
dotenv.config({
  path: 'config.env'
})

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEYID,
  key_secret: process.env.RAZORPAY_KEYSECRET
})


let cartAdd = async (req, res) => {
  try {
    const productId = req.params.productId;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product Not Found'
      })
    }
    if (product.quantity === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product is out of stock'
      });
    }
    const userId = req.session.email._id;
    const user = await Userdb.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'user is not found'
      })
    }

    let cart = await Cart.findOne({
      owner: userId
    });

    if (!cart) {
      cart = new Cart({
        owner: userId,
        items: [],
        billTotal: 0
      })
    }

    const cartItem = cart.items.find((item) => item.productId.toString() === productId)

    if (cartItem) {
      cartItem.productPrice = product.price;
      cartItem.quantity += 1;
      cartItem.price = cartItem.quantity * product.price;
    } else {
      cart.items.push({
        productId: productId,
        name: product.name,
        image: product.image,
        productPrice: product.price,
        quantity: 1,
        price: product.price,
      })
    }

    cart.billTotal = cart.items.reduce((total, item) => total + item.price, 0)
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item added to cart'
    })

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });

  }
}



let cartGet = async (req, res) => {
  try {
    if (req.session.coupon) {
      req.session.coupon = null;
    }
    const userId = req.session.email._id;
    const category = await Category.find();
    const cart = await Cart.findOne({
      owner: userId
    });
    for (const item of cart.items) {
      let data = await Product.findById(item.productId);
      item.data = data;
    }
    const userData = await Userdb.findOne({
      _id: new mongoose.Types.ObjectId(userId),
    });
    const cartItemCount = cart ? cart.items.length : 0;
    let user = (userId) ? true : false
    return res.render('cart', {
      category,
      cart: cart,
      user,
      userData,
      cartItemCount: cartItemCount
    })

  } catch (err) {
    console.log(err)
    return res.status(500).json({
      message: err
    })
  }
}

const cartPut = async (req, res) => {
  try {
    const productId = req.body.productId;

    // Find the user's cart based on their user ID (you may use cookies or sessions)
    const userId = req.body.userId;
    const cart = await Cart.findOne({
      owner: userId
    });

    if (!cart) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Cart not found"
        });
    }

    const cartItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (!cartItem) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Cart item not found"
        });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Product not found"
        });
    }

    cartItem.quantity =
      req.body.need === "sub" ? cartItem.quantity - 1 : cartItem.quantity + 1;
    cartItem.price = cartItem.quantity * cartItem.productPrice;

    cart.billTotal =
      req.body.need === "sub" ?
      cart.billTotal - product.price :
      cart.billTotal + product.price;
    const quantity = cartItem.quantity;

    await cart.save(); // Save the updated cart

    return res.status(200).json({
      success: true,
      quantity: {
        quantity
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


const wishlistTocart = async(req,res)=>{
  try {
    const productId = req.params.productId;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product Not Found'
      })
    }
    if (product.quantity === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product is out of stock'
      });
    }
    const userId = req.session.email._id;
    const user = await Userdb.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'user is not found'
      })
    }

    let cart = await Cart.findOne({
      owner: userId
    });

    if (!cart) {
      cart = new Cart({
        owner: userId,
        items: [],
        billTotal: 0
      })
    }

    const cartItem = cart.items.find((item) => item.productId.toString() === productId)

    if (cartItem) {
      cartItem.productPrice = product.price;
      cartItem.quantity += 1;
      cartItem.price = cartItem.quantity * product.price;
    } else {
      cart.items.push({
        productId: productId,
        name: product.name,
        image: product.image,
        productPrice: product.price,
        quantity: 1,
        price: product.price,
      })
    }

    cart.billTotal = cart.items.reduce((total, item) => total + item.price, 0)
    await cart.save();

    await Wishlist.updateOne(
      { userId: userId },
      { $pull: { products: productId } }
    );

    res.status(200).json({
      success: true,
      message: 'Item added to cart'
    })

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });

  }
}


const cartRemove = async (req, res) => {
  try {
    const productId = req.body.productId;
    const userId = req.body.userId;

    const cart = await Cart.findOne({
      owner: userId
    });

    if (!cart) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Cart Not Found"
        });
    }



    cart.items.find((item) => {
      if (item.productId + '' === productId + '') {
        cart.billTotal -= item.price;
        return true;
      } else {
        return false;
      }
    });

    await Cart.findByIdAndUpdate(cart._id, {
      $set: {
        billTotal: cart.billTotal
      },
      $pull: {
        items: {
          productId: productId
        }
      },
    });

    return res
      .status(200)
      .json({
        success: true,
        message: "Product removed from the cart"
      });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

let cartbillTotalUpdate = async (req, res) => {
  try {
    const selectedProductIds = req.body.selectedProductIds;


    // Find the user's cart
    const userId = req.session.email._id;
    const cart = await Cart.findOne({
      owner: userId
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart is not found based on user'
      });
    }
    // Set 'selected' to true for all selected products
    cart.items.forEach((item) => {
      if (selectedProductIds.includes(item.productId.toString())) {
        item.selected = true;
      } else {
        item.selected = false; // Unselect other products
      }
    });


    let total = 0;
    cart.items.forEach((item) => {
      if (item.selected) {
        total += item.productPrice * item.quantity;
      }
    });
    // Update the cart's billTotal
    cart.billTotal = total;
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Successfully billtotal updated',
      billTotal: cart.billTotal
    });

  } catch (err) {
    console.log(err);
    next(err)
  }
}

let checkoutGet = async (req, res) => {
  try {
    let user = req.session.email._id ? true : false;
    if (req.session.checkout === true) {
      const addresses = await AddressModel.findOne({
        user: req.session.email._id
      })
      const userDetails = await Userdb.findOne({
        _id: req.session.email._id
      })
      const walletData = await wallet.findOne({
        user: new mongoose.Types.ObjectId(userDetails._id)
      });
      const category = await Category.find();

      const cartCheckout = await Cart.findOne({
        owner: req.session.email._id
      });
      const selectedItems = cartCheckout.items
      // Get selected address types based on the user's addresses

      let selectedAddressTypes = []; // Initialize selectedAddressTypes as an empty array

      if (addresses) {
        selectedAddressTypes = addresses.addresses.map((address) => address.addressType);
      }
      // Calculate the total amount for the order
      let billTotal = cartCheckout.items.reduce((total, item) => total + item.price, 0);
      const coupons = await Coupon.find({
        minPurchase: {
          $lte: billTotal
        }
      });
      let couponsession;
      if (req.session.coupon) {
        billTotal = billTotal - (billTotal * req.session.coupon.minDiscountPercentage) / 100;
        req.session.billTotal = billTotal
        couponsession = req.session.coupon
      }

      // Get the count of selected items
      const itemCount = cartCheckout.items.length;

      res.render('Checkout', {
        user,
        category,
        addresses,
        selectedItems,
        billTotal,
        itemCount,
        selectedAddressTypes,
        walletData,
        coupons,
        couponsession
      })
    } else {
      res.redirect('/home/cart')
    }

  } catch (err) {
    console.log(err);
  }
}

async function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Function to generate a unique order ID
async function generateUniqueOrderID() {
  // Generate a random 6-digit number
  const randomPart = await getRandomNumber(100000, 999999);

  // Get the current date
  const currentDate = new Date();

  // Format the date as YYYYMMDD
  const datePart = currentDate.toISOString().slice(0, 10).replace(/-/g, '');

  // Combine the date and random number with "ID"
  const orderID = `ID_${randomPart}${datePart}`;

  return orderID;
}



let checkoutPost = async (req, res, next) => {
  try {
    // Validate the request body
    if (!req.body.paymentOption || !req.body.addressType) {
      // Handle invalid or missing data in the request
      return res.status(400).json({
        success: false,
        error: "Invalid data in the request"
      });
    }
    const cart = await Cart.findOne({
      owner: req.session.email._id
    });

    if (!cart || cart.items.length === 0) {
      // Handle the case where the user has no items in the cart
      return res.status(400).json({
        success: false,
        error: "No items in the cart"
      });
    }

    let selectedItems = cart.items;

    // Check if any selected items have already been ordered
    const orderedItems = await OrderModel.find({
      user: req.session.email._id,
      items: {
        $elemMatch: {
          productId: {
            $in: selectedItems.map(item => item.productId)
          }
        }
      }
    });

    if (orderedItems.length > 0) {
      selectedItems = selectedItems.filter(item => !orderedItems.some(orderedItem =>
        orderedItem.items.some(orderedItemItem => orderedItemItem.productId === item.productId)
      ));
    }

    const Address = await AddressModel.findOne({
      user: req.session.email._id
    });


    if (!Address) {
      // Handle the case where the user has no address
      return res.status(400).json({
        success: false,
        error: "User has no address"
      });
    }
    const deliveryAddress = Address.addresses.find(
      (item) => item.addressType === req.body.addressType
    );

    if (!deliveryAddress) {
      // Handle the case where the requested address type was not found
      return res.status(400).json({
        success: false,
        error: "Address not found"
      });
    }
    const orderAddress = {
      addressType: deliveryAddress.addressType,
      HouseNo: deliveryAddress.HouseNo,
      Street: deliveryAddress.Street,
      Landmark: deliveryAddress.Landmark,
      pincode: deliveryAddress.pincode,
      city: deliveryAddress.city,
      district: deliveryAddress.district,
      State: deliveryAddress.State,
      Country: deliveryAddress.Country,
    };

    let billTotal = selectedItems.reduce((total, item) => total + item.price, 0);
    if (req.session.billTotal) {
      billTotal = req.session.billTotal
    }

    // Deduct purchased items from inventory
    for (const item of selectedItems) {
      const product = await Product.findOne({
        _id: item.productId
      });

      if (product) {
        // Ensure that the requested quantity is available in stock
        if (product.countInStock >= item.quantity) {
          // Decrease the countInStock by the purchased quantity
          product.countInStock -= item.quantity;
          await product.save();
        } else {
          // Handle the case where the requested quantity is not available
          return res.status(400).json({
            success: false,
            error: "Not enough stock for some items"
          });
        }
      } else {
        // Handle the case where the product was not found
        return res.status(400).json({
          success: false,
          error: "Product not found"
        });
      }

    }
    if (req.body.paymentOption === "cashOnDelivery") {
      var order_id = await generateUniqueOrderID();
      // Create a new order
      const order = new OrderModel({
        user: req.session.email._id,
        cart: cart._id,
        items: selectedItems,
        billTotal,
        oId: order_id,
        orderId: order_id,
        paymentStatus: 'Pending',
        paymentMethod: req.body.paymentOption,
        deliveryAddress: orderAddress,
      });
      await order.save();

      // Remove selected items from the cart
      const selectedItemIds = selectedItems.map((item) => item.productId);

      // Remove selected items from the cart using $pull
      await Cart.updateOne({
        _id: cart._id
      }, {
        $pull: {
          items: {
            productId: {
              $in: selectedItemIds
            }
          }
        }
      });
      cart.billTotal = 0
      await cart.save();

      // Get the order ID after saving it
      const orderId = order._id;

      return res.status(201).json({
        success: true,
        message: 'order placed successfully',
        orderId
      }); // Redirect to a confirmation page
    } else if (req.body.paymentOption === "Wallet") {
      var order_id = await generateUniqueOrderID();
      // Create a new order
      const userWallet = await wallet.findOne({
        user: req.session.email._id
      });
      if (!userWallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      if (userWallet.balance < billTotal) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient funds in the wallet'
        });
      }

      const order = new OrderModel({
        user: req.session.email._id,
        cart: cart._id,
        items: selectedItems,
        billTotal,
        oId: order_id,
        orderId: order_id,
        paymentStatus: 'Success',
        paymentMethod: req.body.paymentOption,
        deliveryAddress: orderAddress,
        // Add more order details as needed
      });
      await order.save();
      userWallet.balance -= billTotal;
      await userWallet.save();
      const userTransactions = await transactions.findOne({
        userId: req.session.email._id
      });

      if (!userTransactions) {
        var transaction = new transactions({
          userId: req.session.email._id,
          transactions: [{
            transactionType: "debit",
            amount: order.billTotal,
            date: new Date(),
            payment: "Wallet"
          }]
        })
        await transaction.save();

      } else {
        userTransactions.transactions.push({
          transactionType: "debit",
          amount: order.billTotal,
          date: new Date(),
          payment: "Wallet"
        })

        await userTransactions.save();
      }
      // Remove selected items from the cart
      const selectedItemIds = selectedItems.map((item) => item.productId);

      // Remove selected items from the cart using $pull
      await Cart.updateOne({
        _id: cart._id
      }, {
        $pull: {
          items: {
            productId: {
              $in: selectedItemIds
            }
          }
        }
      });
      cart.billTotal = 0
      await cart.save();

      // Get the order ID after saving it
      const orderId = order._id;
      return res.status(201).json({
        success: true,
        message: 'order placed successfully',
        orderId
      });

    } else if (req.body.paymentOption === "Razorpay") {
      // Handle Razorpay


      const amount = billTotal * 100; // Convert to paise or cents
      var order_id = await generateUniqueOrderID();

      const orderData = new OrderModel({
        user: req.session.email._id,
        cart: cart._id,
        items: selectedItems,
        billTotal,
        paymentStatus: "Pending",
        orderId: null,
        oId: order_id,
        paymentId: null,
        paymentMethod: req.body.paymentOption,
        deliveryAddress: orderAddress,
        // Add more order details as needed
      });
      // Create a new order
      req.session.order = new OrderModel(orderData);
      // Create a Razorpay order and send the order details to the client
      const options = {
        amount,
        currency: 'INR',
        receipt: 'razorUser@gmail.com', // Replace with your email
      };

      razorpayInstance.orders.create(options, async (err, razorpayOrder) => {
        if (!err) {
          req.session.order.orderId = razorpayOrder.id;

          try {
            let order = req.session.order
            return res.status(201).json({
              success: true,
              msg: 'Order Created',
              order,
              amount,
              key_id: process.env.RAZORPAY_KEYID,
              contact: req.session.email.mobile, // Replace with user's mobile number
              name: req.session.email.name,
              email: req.session.email.email,
              address: `${orderAddress.addressType}\n${orderAddress.HouseNo} ${orderAddress.Street}\n${orderAddress.pincode} ${orderAddress.city} ${orderAddress.district}\n${orderAddress.State}`,
            });



          } catch (saveError) {
            console.error('Error saving order to the database:', saveError);
            return res.status(400).json({
              success: false,
              msg: 'Failed to save order'
            });
          }
        } else {
          console.error('Error creating Razorpay order:', err);
          return res.status(400).json({
            success: false,
            msg: 'Something went wrong!'
          });
        }
      });
    } else {

      return res.status(400).json({
        success: false,
        error: 'Invalid payment option'
      });
    }



  } catch (err) {
    console.error(err);
    next(err);
  }
};


let orderConfirmation = async (req, res) => {
  const orderId = req.params.orderId;
  // Validate if orderId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(404).render('errorHandler');
  }

  try {
    req.session.checkout = false;
    let orderDetails = await OrderModel.findById(orderId)
    if (!orderDetails) {
      return res.status(404).render('errorHandler');
    }

    res.render('orderConfirmation', {
      orderId
    })
  } catch (err) {
    console.log(err);

  }
}


const checkverify = (req, res, next) => {
  req.session.checkout = true
  res.redirect('/home/cart/checkout')
}



let razorpayVerify = async (req, res) => {
  try {
    const body = req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEYSECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === req.body.razorpay_signature) {
      const order = new OrderModel(req.session.order)
      await order.save()

      // Find the previously stored record using orderId
      const updatedOrder = await OrderModel.findOneAndUpdate({
        orderId: req.body.razorpay_order_id
      }, {
        paymentId: req.body.razorpay_payment_id,
        signature: req.body.razorpay_signature,
        paymentStatus: "Success",
      }, {
        new: true
      });

      let userTransactions = await transactions.findOne({
        userId: req.session.email._id
      });

      if (!userTransactions) {
        // Create a new transaction entry if there are no prior transactions for the user
        const transaction = new transactions({
          userId: req.session.email._id,
          transactions: [{
            transactionType: "debit",
            amount: order.billTotal,
            date: new Date(),
            payment: "Razorpay",
          }]
        });

        await transaction.save();
      } else {
        // Add a new transaction entry to the existing transactions array
        userTransactions.transactions.push({
          transactionType: "debit",
          amount: order.billTotal,
          date: new Date(),
          payment: "Razorpay",
        });

        await userTransactions.save();
      }

      if (updatedOrder) {
        const cart = await Cart.findOne({
          owner: req.session.email._id
        });
        // Remove selected items from the cart
        cart.items = [];
        cart.billTotal = 0;
        await cart.save();
        // Render the payment success page
        return res.json({
          success: true,
          message: 'Order Sucessfully',
          updatedOrder
        })
      } else {
        // Handle the case where the order couldn't be updated
        return res.json({
          success: false,
          message: 'Order Failed Please try Again'
        })
      }
    } else {

      let cartData = await Cart.findOneAndDelete({
        oId: req.body.oId
      })
      cartData.save();
      // Handle the case where the signature does not match
      return res.json({
        success: false,
        message: 'Order Failed Please try Again'
      })
    }
  } catch (err) {
    console.log(err);
    let cartData = await Cart.findOne({
      oId: req.body.oId
    })
    let orderToRemove = await Cart.findOneAndDelete({
      oId: cartData.oId
    })
    orderToRemove.save();
    // Handle errors
    return res.render('paymentFailed', {
      title: "Error",
      error: "An error occurred during payment verification",
      cartData
    });
  }
};



let razorpayFailed = async (req, res) => {
  try {
    let orderId = cartData.oId;
    let orderToRemove = await Cart.findOneAndDelete({
      oId: orderId
    });
    orderToRemove.save();
    res.status(200).render('paymentFailed')
  } catch (err) {
    console.log(err)
  }
}



module.exports = {
  cartAdd,
  cartGet,
  cartPut,
  cartRemove,
  cartbillTotalUpdate,
  checkoutGet,
  checkoutPost,
  orderConfirmation,
  checkverify,
  razorpayVerify,
  razorpayFailed,
  wishlistTocart
}