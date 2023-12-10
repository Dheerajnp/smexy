const mongoose = require('mongoose');

const categorySchema =  new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    description: {
      type: String,
      required: true,
    },
    offer:{
      type:Number,
      default:0
    },
    image: {
      type: String, // You can use String to store the image URL or file path
  },
  status: {
    type: String,
    enum: ['active', 'unlisted'],
    default: 'active',
},
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }]
  }, {
    timestamps: true
  });
  categorySchema.pre('save', async function (next) {
    // Check if the status has been modified to 'unlisted'
    if (this.isModified('status') && this.status === 'unlisted') {
        // When the category status is updated to 'unlisted',
        // find all products with that category and set their isCategoryBlocked field to true
        await this.model('Product').updateMany(
            { category: this._id },
            { isCategoryBlocked: true , isFeatured:false}
        );
    }
    else if (this.isModified('status') && this.status === 'active') {
      // When the category status is updated to 'active',
      // find all products with that category and set their isCategoryBlocked field to false
      await this.model('Product').updateMany(
          { category: this._id },
          { isCategoryBlocked: false }
      );
  }
    next();
  });



const Category = mongoose.model('Category',categorySchema);
module.exports= Category;