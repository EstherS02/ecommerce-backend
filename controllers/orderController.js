import mongoose from "mongoose";
import Order from "../models/Order.js"
import { updateOrderStatusSchema } from "../validators/orderValidators.js";

export async function getOrders(req, res) {
    try {

        const {
            page: pageQuery,
            limit: limitQuery
        } = req.query

        const page = Number(pageQuery) || 1;
        const limit = Number(limitQuery) || 10;
        const skip = (page - 1) * limit;

        const orders = await Order.find({
            user: req.user.userId
        })
            .populate({
                path: "items.product",
                select: "title image category"
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .lean();

        if (!orders.length) {
            return res.status(200).json([]);
        }

        return res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

export async function getOrderById(req, res) {
    try {
        const {
            id
        } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Order ID"
            })
        }

        const order = await Order.findOne({
            _id: id,
            user: req.user.userId
        })
        .populate({
            path: "items.product",
            select: "title image category"
        })
        .lean()

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        return res.status(200).json(order);
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

export async function updateOrderStatus(req, res) {
    try {

        const result = updateOrderStatusSchema.safeParse(req.body)

        if (!result.success){
            return res.status(400).json({
                message: result.error.issues
            });
        }

        const { status } = result.data;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid Order ID"
            })
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            })
        }

        const allowedTransitions  = {
            Pending: ["Confirmed", "Cancelled"],
            Confirmed: ["Packed", "Cancelled"],
            Packed: ["Shipped"],
            Shipped: ["Delivered"],
            Delivered:[],
            Cancelled: []
        }

        if (!allowedTransitions[order.status].includes(status)) {
            return res.status(400).json({
                message: "Invalid status transition"
            })
        }

        order.status = status;

        if (status == 'Delivered') {
            order.deliveredAt = new Date();
        }

        await order.save();

        return res.status(201).json(order);

    } catch(error) {
        res.status(500).json({
            message: error.message
        })
    }
}