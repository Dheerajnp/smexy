const express = require('express');
const Userdb = require('../controller/database');
const Product = require('../models/productModel');

const Category = require('../models/categoryModel')


//get to load product page 
const productManagementGet = async (req, res) => {     
    try {
        let query = {};
        let searchQuery=req.query.search;
        // Check if a category is selected for filtering
        const selectedCategory = req.query.category || ''; // Default to empty string if not provided
        if (selectedCategory) {
            query.category = selectedCategory;
        }

        if (searchQuery) {
            // Case-insensitive search by using a regular expression
            query.$or = [
                { name: { $regex: new RegExp(searchQuery, 'i') } }, // 'i' option for case-insensitive search
                { brand: { $regex: new RegExp(searchQuery, 'i') } }
            ];
        }

        if(req.query.page){
            page=parseInt(req.query.page);
          }else{
            page= 1 ;
          }
          const limit = 5;
          const skip = (page-1)*limit
            const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .populate('category') // Populate the 'category' field
            .lean().skip(skip).limit(limit);

        const categories = await Category.find().lean();
        const totalPages = Math.ceil(total/limit);
        res.render('productManagement', { products,currentPage:page,totalPages,categories,selectedCategory, pagetitle: 'Products' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};

//to get product categories
const productCategories = async (req, res) => {
    try {
        const categories = await Category.find({}, 'name'); // Only fetch category names
        res.status(200).json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


//Create new products
const productManagementCreate =  async (req, res) => {
        try {
            let admin = await Userdb.findOne({email:"dheerajpradi@gmail.com"})
            // Extract product details from the request body
            let price = Math.floor(parseInt(req.body.price) - (parseInt(req.body.price) * (parseInt(req.body.discountPrice) / 100)));
            if(price<=0){
                price=req.body.price
            }
            const product = new Product({
                owner: admin._id, // Adjust this based on how you handle user authentication
                name: req.body.name,
                description: req.body.description,
                image: req.files['image'][0].path.replace(/\\/g, '/'), // Assuming 'image' is the name attribute of the main image input
                images: req.files['images'].map(file => file.path.replace(/\\/g, '/')), // Assuming 'images' is the name attribute of the additional images input
                brand: req.body.brand,
                countInStock: req.body.countInStock,
                category: req.body.category, // You may need to convert this to a MongoDB ObjectId
                price,
                discountPercentage:req.body.discountPrice,
                originalPrice:req.body.price
            });
           
            // Save the new product to the database
             product.save().then(async (product) => {
                // Associate the product with its category
                const category = await Category.findById(product.category);
                if (category) {
                    category.products.push(product._id);
                    await category.save();
                }
                console.log('Product saved successfully.');
            })
            .catch((error) => {
                console.error('Error saving product:', error);
            });;
    
            return res.status(201).redirect('/admin/product-management');
        } catch (error) {
            console.error('Error adding product: ' + error);
            return res.status(500).send({ error: 'Internal Server Error', errorMessage: error.message });
        }
    };


//Edit existing products
    const productManagementEdit = async (req, res) => {
        try {
            // Check if the product with the specified ID exists in the database
            const productId = req.params.Id;
            const existingProduct = await Product.findById(productId);
            if (!existingProduct) {
                return res.status(404).json({ error: 'Product not found' });
            }
    
            // Extract product details from the request body
            const {
                name,
                description,
                brand,
                countInStock,
                category,
                price,
                discountPrice
            } = req.body;
            let discount = Math.floor(parseInt(req.body.price) - (parseInt(req.body.price) * (parseInt(req.body.discountPrice) / 100)));
            if(discount<=0){
                discount=req.body.price
            }
            
            // Initialize image and images variables
            let image = existingProduct.image;
            let images = existingProduct.images;
    
            // Check if files are provided in the request
            if (req.files) {
                // Process the main image
                if (req.files['image']) {
                    image = req.files['image'][0].path.replace(/\\/g, '/');
                }
    
                // Process additional images (if any)
                if (req.files['images']) {
                    images = req.files['images'].map((file) =>
                        file.path.replace(/\\/g, '/')
                    );
                }
            }

            // Update the product in the database
            const updatedProduct = await Product.findByIdAndUpdate(
                productId,
                {
                    name,
                    description,
                    brand,
                    countInStock,
                    category,
                    price:discount,
                    image,
                    images,
                    discountPercentage:discountPrice,
                    originalPrice:price
                },
                {
                    new: true,
                }
            );
            const updatedCategory = await Category.findById(updatedProduct.category);
            if (updatedCategory) {
                updatedCategory.products.push(updatedProduct._id);
                await updatedCategory.save();
            }
            if (!updatedProduct) {
                return res.status(404).json({ message: 'Product not found' });
            }
            
    
            res.status(200).redirect('/admin/product-management');
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error', errorMessage: error.message });
        }
    };
    
      


//Delete porducts
const productManagementDelete =  async (req, res) => {
    const { productId } = req.params;

    try {
        // Find the product by ID and delete it
        const deletedProduct = await Product.findOneAndDelete({ _id: productId });

        if (!deletedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

//Publish or unpublish products
const productManagementPublish =  async (req, res) => {
    try {
        const productId = req.params.productId;
        const { isFeatured } = req.body;
        // Find the product by ID and update the isFeatured field
        const product = await Product.findByIdAndUpdate(productId, { isFeatured }, { new: true });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        return res.status(200).json({ message: 'Product status updated successfully', product });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}





module.exports ={ productManagementGet,
    productManagementCreate,
    productCategories,
    productManagementEdit,
    productManagementDelete,
    productManagementPublish }