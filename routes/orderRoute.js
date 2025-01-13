const express = require("express");
const { createOrder, getOrderById, updateOrderToPaid, updateOrderToDelivered, getMyOrders, getAllOrders, createCheckout, cancelOrder } = require("../controllers/orderControllers");
const { protect, admin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/createOrder", protect, createOrder);

router.get("/:orderId", protect, getOrderById);

router.delete("/orders/:orderId/cancel", cancelOrder);

router.put("/:orderId/paid", protect, admin, updateOrderToPaid);

router.put("/:orderId/delivered", protect, admin, updateOrderToDelivered);

router.get("/myorders/:customerId", protect, getMyOrders);

router.get("/", protect, admin, getAllOrders);

router.post("/checkout", createCheckout);





module.exports = router;
