import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { cartSchema, checkoutSchema, deleteCartSchema } from "../validators/cartValidator.js";
import Order from "../models/Order.js";

export async function addCart(req, res) {
    try {

        const result = cartSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: result.error.issues
            })
        }

        const {
            productId,
            quantity
        } = result.data;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product Not Found"
            })
        }

        const existingCart = await Cart.findOne({
            user: req.user.userId
        })

        if (!existingCart) {
            const cart = await Cart.create({
                user: req.user.userId,
                items: [
                    {
                        product: productId,
                        quantity
                    }
                ]
            })

            return res.status(201).json(cart)
        }

        const existingProduct = existingCart.items.find(item => item.product.toString() === productId);

        if (!existingProduct) {
            if (product.stock < quantity) {
                return res.status(400).json({
                    message: "Insufficient Stock"
                });
            }

            existingCart.items.push({
                product: productId,
                quantity
            });

        } else {
            if (product.stock < (existingProduct.quantity + quantity)) {
                return res.status(400).json({
                    message: "Insufficient Stock"
                })
            }

            existingProduct.quantity += quantity;

        }

        await existingCart.save();
        return res.status(200).json(existingCart);

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

export async function getCart(req, res) {
    try {
        const cart = await Cart.findOne({
            user: req.user.userId
        })
            .populate({
                path: "items.product",
                select: "title price image stock"
            })
            .lean();

        //.populate("items.product"); -> For all values

        if (!cart) {
            return res.status(200).json({
                items: []
            })
        }

        return res.status(200).json(cart)
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

export async function updateCart(req, res) {
    try {

        const result = cartSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: result.error.issues
            })
        }

        const {
            productId,
            quantity
        } = result.data;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product Not Found"
            })
        }

        const cart = await Cart.findOne({
            user: req.user.userId
        })

        if (!cart) {
            return res.status(404).json({
                message: "Cart Not Found"
            })
        }

        const existingProduct = cart.items.find(item => item.product.toString() === productId);

        if (!existingProduct) {
            return res.status(404).json({
                message: "Product not found in cart"
            })
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                message: "Insufficient Stock"
            });
        }

        existingProduct.quantity = quantity;

        await cart.save();
        await cart.populate({
            path: "items.product",
            select: "title price image stock"
        });

        return res.status(200).json(cart);

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

export async function removeCart(req, res) {
    try {
        const result = deleteCartSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: result.error.issues
            })
        }

        const {
            productId
        } = result.data;

        const cart = await Cart.findOne({
            user: req.user.userId
        })

        if (!cart) {
            return res.status(404).json({
                message: "Cart Not Found"
            })
        }

        const originalLength = cart.items.length;

        cart.items = cart.items.filter(item => item.product.toString() !== productId)

        if (cart.items.length === originalLength) {
            return res.status(404).json({
                message: "Product not found in cart"
            });
        }

        if (cart.items.length === 0) {
            await Cart.deleteOne({ _id: cart._id });

            return res.status(200).json({
                message: "Cart is empty"
            });
        }

        await cart.save()
        await cart.populate({
            path: "items.product",
            select: "title price image stock"
        });
        return res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

export async function checkout(req, res) {
    const session = await mongoose.startSession();

    try {

        const result = checkoutSchema.safeParse(req.body)

        if (!result.success) {
            return res.status(400).json({
                message: result.error.issues
            })
        }

        const {
            shippingAddress
        } = result.data;

        session.startTransaction();

        const cart = await Cart.findOne({
            user: req.user.userId
        }).session(session);

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                message: "Cart is empty"
            });
        }

        const itemArr = [];
        let totalAmount = 0;

        for (const item of cart.items) {
            const product = await Product.findById(item.product).session(session);

            if (!product) {
                return res.status(404).json({
                    message: "Product not found"
                });
            }

            itemArr.push({
                product: item.product,
                quantity: item.quantity,
                price: product.price
            })

            totalAmount += product.price * item.quantity;

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: "Insufficient Stock"
                });
            }

            product.stock -= item.quantity;

            await product.save({
                session
            })
        }

        const order = new Order({
            user: req.user.userId,
            items: itemArr,
            totalAmount,
            status: "Pending",
            paymentStatus: "Pending",
            shippingAddress
        });

        await order.save({ session });

        await Cart.deleteOne({ _id: cart._id }, { session });

        await session.commitTransaction();
        res.status(200).json(order)
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({
            message: error.message
        })
    } finally {
        session.endSession();
    }
}