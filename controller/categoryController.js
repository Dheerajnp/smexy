const Category = require('../models/categoryModel');
const database = require('./database');
const product = require('../models/productModel')

const multer = require('multer');

const categoryManagementGet = async (req, res) => {
    const Items_Page = 6
    try {
       
         let search = '';
         let page = 1;
         if(req.query.search){
            search = req.query.search;
         }
         if(req.query.page && parseInt(req.query.page)){
            page = parseInt(req.query.page);
         }
         const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
         const totalItems = await Category.countDocuments({
           $or : [
            {name:{ $regex: new RegExp(sanitizedSearch, 'i')}},
           ]
         })
         const totalPages = Math.ceil(totalItems/Items_Page);
         const skip = (page - 1) * Items_Page;
         const categories = await Category.find({
        $or : [
          {name : { $regex : new RegExp(sanitizedSearch , 'i')}}
        ]
       })
       .skip(skip)
       .limit(Items_Page)
        if(req.session.categoryErr){
            var categoryErr= req.session.categoryErr
            req.session.categoryErr = null
           }else{
             categoryErr = ''
           }
     

        res.render('category', {
            pagetitle: 'Category',
            categories: categories, 
            totalPages,
            search,
            currentPage : page,
            categoryErr

        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).send('Internal Server Error');
    }
};




const categoryManagementCreate = async (req, res) => {
    try {
        const {
            name,
            description
        } = req.body;
        let image = null
        if (req.file) {

            image = req.file.path.replace(/\\/g, '/').replace('public/', '');
        }
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp("^" + name + "$", "i") }
        });
          if (existingCategory) {
            req.session.categoryErr='Category Exists'
            return res.redirect('/admin/category-management');
          }

        const category = new Category({
            name,
            description,
            image
        });

        await category.save();

        res.status(201).redirect('/admin/category-management');
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
}


const categoryManagementEdit = async (req, res) => {
    try {
        let {
            editName,
            editDescription
        } = req.body;
        editName = editName.trim();
        editDescription = editDescription.trim();
        const categoryId = req.params.categoryId;
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({
                message: 'Category not found'
            });
        }
        // Update name and description
        category.name = editName;
        category.description = editDescription;
        console.log("ghgdhhahahatha")
        // Update image if a new one is uploaded
        if (req.file) {
            console.log("ghsghsghsgh")
            // Replace backslashes with forward slashes and remove 'public/' from the path
            const newImage = req.file.path.replace(/\\/g, '/').replace('public/', '');
            category.image = newImage;
        }
        await category.save();

        res.status(200).redirect('/admin/category-management');
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
}


const categoryManagementDelete = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;


        const result = await Category.deleteOne({
            _id: categoryId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: 'Category not found'
            });
        }
        await product.updateMany({
            category: categoryId
        }, {
            isFeatured: false
        })
        res.status(200).json({
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
}


module.exports = {
    categoryManagementCreate,
    categoryManagementGet,
    categoryManagementEdit,
    categoryManagementDelete
}