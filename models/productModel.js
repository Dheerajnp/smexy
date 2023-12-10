const mongoose = require('mongoose');

const objectID = mongoose.Schema.Types.ObjectId;

const productSchema = new mongoose.Schema({
  owner: {
    type: objectID,
    required: true,
    ref: 'users'
  },

  name: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true
  },

  image: {
    type: String,
    default: ''
  },

  images: [{
    type: String,
  }],

  brand: {
    type: String
  },

  countInStock: {
    type: Number,
    required: true,
    min: 0,
    max: 300
  },

  rating: {
    type: Number,
    default: 0,
  },

  isFeatured: {
    type: Boolean,
    default: true
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  discountPercentage: {
    type: Number,
    default: 0
  },
  originalPrice: {
    type: Number,
  },
  price: {
    type: Number,
    required: true,
    default: 0,

  }
}, {
  timestamps: true
})

//   productSchema.pre('save', function(next) {
//     const price = this.price || 0;
//     const discount = this.discountPrice || 0;
//     this.afterDiscount = Math.floor(parseInt(price) - (parseInt(price) * (parseInt(discount) / 100)));
//     next();
// });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;