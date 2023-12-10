const session = require('express-session');
const Userdb = require('./database');
const bcrypt = require('bcrypt');
const  categoryDb  = require('../models/categoryModel')
const {Coupon} = require('../models/couponModel')
const Product = require('../models/productModel');
const orderModel = require('../models/OrderModel')
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs')
let adminname;



async function salesReport(date) {
  const currentDate = new Date();
  let orders = [];

  for (let i = 0; i < date; i++) {
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - i);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(currentDate);
    endDate.setDate(currentDate.getDate() - i);
    endDate.setHours(23, 59, 59, 999);  

    const dailyOrders = await orderModel.find({
      status: "Delivered",
      orderDate: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    orders = [...orders, ...dailyOrders];
  }
  let users = await Userdb.countDocuments();

  let totalOrderCount = await orderModel.find({
    status: "Delivered",
  });

  let Revenue = 0;
  totalOrderCount.forEach((order) => {
    Revenue += order.billTotal;
  });

  let stock = await Product.find();
  let totalCountInStock = 0;
  stock.forEach((product) => {
    totalCountInStock += product.countInStock;
  });

  let averageSales = totalOrderCount.length / date; 
  let averageRevenue = Revenue / date; 

  return {
    users,
    totalOrders: orders.length,
    totalOrderCount: totalOrderCount.length,
    totalCountInStock,
    averageSales,
    averageRevenue,
    Revenue,
    orders
  };
}

let dashboard = async (req, res) => {
  if (req.session.admin) {
    req.session.admn = true;

    let orders = await orderModel.find().sort({ createdAt: -1 }).limit(10).populate('user', 'fullname')

    let daily = await salesReport(1)
    let weekly = await salesReport(7);
    let monthly = await salesReport(30);
    let yearly = await salesReport(365)

    console.log("D:",daily,"W:",weekly,"M:",monthly,"Y:",yearly);
    let allProductsCount = await Product.countDocuments();
    let allcategoriesCount = await categoryDb.countDocuments();

    res.render("dashboard",{daily,weekly,monthly,yearly,orders,allProductsCount,allcategoriesCount});
  } else {
    res.redirect("/admin/signin");
  }
};


const pdfMake = require('pdfmake/build/pdfmake.js');
const pdfFonts = require('pdfmake/build/vfs_fonts.js');
pdfMake.vfs = pdfFonts.pdfMake.vfs;

const downloadPdf = async (req, res) => {
  try {
    let salesData = null; 

    if (req.query.type === 'daily') {
      salesData = await salesReport(1);
    } else if (req.query.type === 'weekly') {
      salesData = await salesReport(7);
    } else if (req.query.type === 'monthly') {
      salesData = await salesReport(30);
    } else if (req.query.type === 'yearly') {
      salesData = await salesReport(365);
    }

    let docDefinition = {
      content: [
        { text: 'Sales Report', style: 'header' }
      ],
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          alignment: 'center'
        },
        tableExample: {
          margin: [0, 5, 0, 15]
        }
      }
    };

    if (salesData) {
      docDefinition.content.push(
        `Total Revenue: INR ${salesData.Revenue}`,
        `Total Order Count: ${salesData.totalOrderCount}`,
        `Total Count In Stock: ${salesData.totalCountInStock}`,
        `Average Sales: ${salesData.averageSales ? salesData.averageSales.toFixed(5) : 'N/A'}%`,
        `Average Revenue: ${salesData.averageRevenue ? salesData.averageRevenue.toFixed(5) : 'N/A'}%`
      );

      let orders = salesData.orders;

      if (orders && orders.length > 0) {
        // Adding order details to PDF
        let rows = orders.map(order => [
          order.oId,
          order.status,
          order.orderDate.toLocaleString(),
          order.paymentMethod,
          `INR ${order.billTotal}`
        ]);

        docDefinition.content.push({
          style: 'tableExample',
          table: {
            headerRows: 1,
            body: [
              ['OrderID', 'Status', 'Date', 'Payment Method', 'Total'],
              ...rows
            ]
          }
        });
      } else {
        docDefinition.content.push('No order details available.');
      }
    } else {
      docDefinition.content.push('No sales data available.');
    }

    const pdfDoc = pdfMake.createPdf(docDefinition);
    pdfDoc.getBuffer((buffer) => {
      res.writeHead(200, 
      {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment;filename="filename.pdf"'
      });
      res.end(buffer);
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Error generating PDF.');
  }
};



const generateExcel = async (req, res, next) => {
  try {
    const salesDatas = await salesReport(0);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.columns = [
      // { header: 'Total Revenue', key: 'totalRevenue', width: 15 },
      { header: 'Total Orders', key: 'totalOrders', width: 15 },
      { header: 'Total Count In Stock', key: 'totalCountInStock', width: 15 },
      { header: 'Average Sales', key: 'averageSales', width: 15 },
      { header: 'Average Revenue', key: 'averageRevenue', width: 15 },
      { header: 'Revenue', key: 'Revenue', width: 15 },
    ];

    worksheet.addRow({

      totalOrders: salesDatas.totalOrderCount,
      totalCountInStock: salesDatas.totalCountInStock,
      averageSales: salesDatas.averageSales ? salesDatas.averageSales.toFixed(2) : 'N/A',
      averageRevenue: salesDatas.averageRevenue ? salesDatas.averageRevenue.toFixed(2) : 'N/A',
      Revenue: salesDatas.Revenue,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');

    workbook.xlsx.write(res).then(() => res.end());
  } catch (error) {
    console.log(error);
    return res.status(500).send('Error generating Excel file.');
  }
};



let admlogin=(req,res,next)=>{
  if(req.session.admin){
    res.redirect('/admin')
  }else{
    res.render('admlogin')
  }
    
}

let admverify=async(req,res,next)=>{
    let formdata=req.body;
    let userdata= await Userdb.findOne({email:formdata.email});
    if(userdata){
        const passwordMatch = await bcrypt.compare(formdata.password, userdata.password);
        if(passwordMatch){
            
            if(userdata.admin===true){
              req.session.admin=formdata.email;
                res.redirect('/admin');
            }else{
                res.render('admlogin',{message:"User not an admin"})
            }
            
        }
        else{
            res.render('admlogin',{message:"Password incorrect"})
        }
    }else{
        res.render('admlogin',{message:"Admin email not found"})
    }
}

const adminSideUsersList = async(req,res)=>{
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
  
    res.render('usersList',{ users ,currentPage:page,totalPages,pagetitle:"Users"});
  
    }catch(err){
      console.error("Error fetching users:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  
  }
  
  const adminUserBlock = async (req, res) => {
    const userId = req.params.Id;
    try {
      const user = await Userdb.findOne({ _id: userId });
      if (!user) {
        return res.status(404).send('User not found');
      }

      if(user.isBlocked===false){
        user.isBlocked=true;
      }else{
        user.isBlocked=false;
      }
      await user.save();
      res.status(200).redirect('/admin/users');
  
    }catch (error) {
      console.error('Error updating user:', error);
      res.status(500).send('Error updating user');
  }
  };
  
  let admLogout=(req,res,next)=>{
    req.session.admin=false;
    res.redirect('/admin/signin')
}


let category=async(req,res,next)=>{
  res.render('category')
}


const couponGet = async (req, res) => {                       //coupon page get 
  try {
      // Assuming you have a Coupon model
      const coupons = await Coupon.find() // Fetch all coupons

      res.render('Coupons', { coupons });
  
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).send('Internal Server Error');
  }
};

const couponPost = async (req, res) => {              //new coupon adding(post)
  try {
    const {
      couponCode,
      validity,
      minPurchase,
      minDiscountPercentage,
      maxDiscountValue,
      discription,
    } = req.body;
    let status = 'Active'
    const newCoupon = new Coupon({
      couponCode,
      validity,
      minPurchase,
      minDiscountPercentage,
      maxDiscountValue,
      discription,
      status
    });

    const savedCoupon = await newCoupon.save();

    res.status(201).json(savedCoupon);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


const couponDelete = async (req,res)=>{
  try{
     const {couponId} = req.params;
  const coupon = await Coupon.findById(couponId)
  if(!coupon){
    return res.status(404).render('page-not-found');
  }
  coupon.status = 'Cancel'
  await coupon.save()
  res.status(200).json({ message: 'coupon canceled successfully' });
  }catch(error){
    console.log(error.message);
  }
}


const categoryOffer = async(req,res)=>{
  try{
          const categories = await categoryDb.find()
          res.render('categoryOffer',{categories ,error : ""})
  }catch(error){
      console.log(error.message);
  }
}

const categoryOfferPost = async (req, res) => {
  try {
      const { category, discount } = req.body;
      if (!category || !discount ) {
          return res.status(400).json({ error: 'Category and discount are required.' });
      }
     
      const categoryDoc = await categoryDb.findOne({ _id: category });
      if (!categoryDoc) {
          return res.status(404).json({ error: 'Category not found.' });
      }
      const existingOffer = await categoryDb.findOne({ _id: category, offer: { $exists: true } });

      if (existingOffer == "") {
         
        return res.status(409).json({success : false});
      }else{
        categoryDoc.offer = discount;
        await categoryDoc.save();

        // Fetch products of the category
const products = await Product.find({ category });

// Apply category offer to products
products.forEach(async (product) => {
    product.discountPercentage = categoryDoc.offer;
    product.price = Math.floor((parseInt(product.originalPrice)) - ((parseInt(product.originalPrice)) * ((parseInt(product.discountPercentage) / 100))));
    await product.save();
});

      res.status(200).json({success : true});
      }
  } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
};
module.exports ={dashboard,downloadPdf,generateExcel,admlogin,admverify,adminSideUsersList,adminUserBlock,admLogout,category,couponGet,couponPost,couponDelete,categoryOffer,categoryOfferPost}