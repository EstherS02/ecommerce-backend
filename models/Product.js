import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: ""
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    deleted: {
        type: Boolean,
        default: false
    }
},
{
    timestamps: true
});

productSchema.pre("find", function () {
    this.where({
        deleted: false
    });
});

productSchema.pre("findOne", function () {
    this.where({
        deleted: false
    });
});

const Product = mongoose.model("Product", productSchema);
export default Product;