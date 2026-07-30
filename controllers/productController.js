import Product from "../models/Product.js";
import mongoose from "mongoose";
import { productSchema } from "../validators/productValidators.js";
import { uploadToS3 } from "../utils/uploadToS3.js";

export async function createProduct(req, res) {
    try {

        const result = productSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: result.error.issues
            })
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Product image is required",
            });
        }

        const image = await uploadToS3(req.file);

        const product = await Product.create({
            ...result.data,
            image
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

export async function getProducts(req, res) {
    try {

        const {
            page: pageQuery,
            limit: limitQuery,
            search,
            category,
            sort,
            minPrice: minPriceQuery,
            maxPrice: maxPriceQuery
        } = req.query

        const page = Number(pageQuery) || 1;
        const limit = Number(limitQuery) || 10;
        const skip = (page - 1) * limit;

        const filter = {
            deleted: false
        }

        if (search) {
            filter.title = {
                $regex: search,
                $options: "i"
            }
        }

        if (category) {
            filter.category = category;
        }

        const minPrice = minPriceQuery ? Number(minPriceQuery) : undefined;
        const maxPrice = maxPriceQuery ? Number(maxPriceQuery) : undefined;

        if (minPrice || maxPrice) {
            filter.price = {};

            if (minPrice) {
                filter.price.$gte = minPrice;
            }

            if (maxPrice) {
                filter.price.$lte = maxPrice;
            }
        }

        let sortOption = {
            createdAt: -1
        };

        if (sort) {
            const field = sort.startsWith("-")
                ? sort.slice(1)
                : sort;

            const allowedSortFields = [
                "price",
                "title",
                "stock",
                "createdAt"
            ];

            if (allowedSortFields.includes(field)) {
                sortOption = {
                    [field]: sort.startsWith("-") ? -1 : 1
                };
            }
        }

        const totalProducts = await Product.countDocuments(filter)

        const products = await Product.find(filter)
            .select("title price image category stock")
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .lean();

        const totalPages = Math.ceil(totalProducts / limit);

        res.status(200).json({
            products,
            currentPage: page,
            totalProducts,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

export async function getProductById(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid Product ID"
            })
        }

        const product = await Product.findOne({
            _id: req.params.id
        });

        if (!product) {
            return res.status(404).json({
                message: "Product Not Found"
            })
        }
        res.status(200).json(product);

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: error.message
        })
    }
}

export async function updateProduct(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid Product ID"
            })
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        )

        if (!updatedProduct) {
            return res.status(404).json({
                message: "Product Not Found"
            })
        }

        res.status(200).json(updatedProduct);

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

export async function deleteProduct(req, res) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                error: "Invalid Product ID"
            })
        }

        const deletedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            {
                deleted: true
            },
            {
                new: true
            }
        );

        if (!deletedProduct) {
            return res.status(404).json({
                error: "Product Not Found"
            })
        }
        res.status(200).json(deletedProduct);
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}