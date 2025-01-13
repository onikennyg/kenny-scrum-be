const http = require('http');
const Order = require("../models/orderModels");
const Product = require("../models/productModels");

// createOrder Function
const createOrder = async (request, response) => {
  try {
    const { customer, orderItems, shippingAddress, paymentMethod } =
      request.body;

    // Validate input
    if (
      !customer ||
      !orderItems ||
      orderItems.length === 0 ||
      !shippingAddress ||
      !paymentMethod
    ) {
      return response.status(400).json({ message: "All fields are required" });
    }

    // Check if products exist and calculate itemsPrice
    let itemsPrice = 0;
    const productIds = orderItems.map((item) => item.product);
    const existingProducts = await Product.find({ _id: { $in: productIds } });

    // Validate each order item
    for (const item of orderItems) {
      const product = existingProducts.find((prod) =>
        prod._id.equals(item.product)
      );
      if (!product) {
        return response
          .status(404)
          .json({ message: `Product with ID ${item.product} not found` });
      }
      // Calculate total price for items
      itemsPrice += product.price * item.quantity;
    }

    // Calculate shipping price (assumed to be a flat rate for this example)
    const shippingPrice = 10.0; // You can modify this based on your logic

    // Create new order
    const newOrder = new Order({
      customer,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice: itemsPrice + shippingPrice,
    });

    // Save order to database
    const savedOrder = await newOrder.save();

    return response
      .status(201)
      .json({ message: "Order placed successfully", savedOrder });
  } catch (error) {
    console.error("Error creating order:", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};


// getOrderById Function
const getOrderById = async (request, response) => {
  try {
    const { orderId } = request.params; // Extract order ID from the request parameters

    // Find the order by its ID
    const order = await Order.findById(orderId);

    // If no order is found, return a 404 error
    if (!order) {
      return response.status(404).json({ message: "Order not found" });
    }

    // Return the order details
    response.status(200).json({ order });
  } catch (error) {
    // If there's an error (e.g., invalid ID format), return a 500 server error
    response
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Function to cancel order -  checks if the order exists, whether it has been paid, or if it has been delivered. 
// If either of those conditions is true, it prevents the cancellation.
const cancelOrder = async (request, response) => {
  try {
    const { orderId } = request.params; // Extract order ID from the request parameters

    // Find the order by its ID
    const order = await Order.findById(orderId);

    // If no order is found, return a 404 error
    if (!order) {
      return response.status(404).json({ message: "Order not found" });
    }

    // Check if the order is already paid or delivered
    if (order.isPaid || order.isDelivered) {
      return response.status(400).json({ message: "Cannot cancel a paid or delivered order" });
    }

    // Update the order status to canceled
    order.isCanceled = true; // You might want to add this field to your Order model
    order.canceledAt = Date.now(); // Track when the order was canceled

    // Save the updated order
    const updatedOrder = await order.save();

    // Return the updated order details
    return response.status(200).json({ message: "Order canceled successfully", order: updatedOrder });
  } catch (error) {
    // If there's an error, return a 500 server error
    return response.status(500).json({ message: "Server error", error: error.message });
  }
};

// updateOrderToPaid Function
// const updateOrderToPaid = async (request, response) => {
//   try {
//     const { orderId } = request.params; // Extract order ID from the request parameters

//     // Find the order by its ID
//     const order = await Order.findById(orderId);

//     // If no order is found, return a 404 error
//     if (!order) {
//       return response.status(404).json({ message: "Order not found" });
//     }

//     // Check if the order is already delivered
//     if (order.isPaid) {
//       return response
//         .status(400)
//         .json({ message: "Order has already been paid for" });
//     }

//     // Update the order status
//     order.isPaid = true; // Set isDelivered to true
//     order.deliveredAt = Date.now(); // Set the delivery timestamp

//     // Save the updated order
//     const updatedOrder = await order.save();

//     // Return the updated order details
//     response
//       .status(200)
//       .json({ message: "Order updated to paid", order: updatedOrder });
//   } catch (error) {
//     // If there's an error, return a 500 server error
//     response
//       .status(500)
//       .json({ message: "Server error", error: error.message });
//   }
// };

const updateOrderToPaid = async (request, response) => {
  try {
    const { reference } = request.body; // Get the payment reference from the request body

    // Options for the HTTP request to verify the transaction
    const options = {
      hostname: 'api.paystack.co',
      path: `/transaction/verify/${reference}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // Your Paystack secret key
      },
    };

    // Make the HTTP request
    const req = http.request(options, async (res) => {
      let data = '';

      // Listen for data
      res.on('data', (chunk) => {
        data += chunk;
      });

      // When the response ends
      res.on('end', async () => {
        const verifyResponse = JSON.parse(data);
        if (verifyResponse.status) {
          const orderId = verifyResponse.data.metadata.orderId; // Get the order ID from metadata

          // Find the order by its ID
          const order = await Order.findById(orderId);
          if (!order) {
            return response.status(404).json({ message: "Order not found" });
          }

          if (order.isPaid) {
            return response.status(400).json({ message: "Order has already been paid for" });
          }

          // Update the order status
          order.isPaid = true;
          order.paidAt = Date.now();
          order.paymentReference = reference; // Store the payment reference

          const updatedOrder = await order.save();
          return response.status(200).json({ message: "Order updated to paid", order: updatedOrder });
        } else {
          return response.status(400).json({ message: "Payment verification failed" });
        }
      });
    });

    // Handle error
    req.on('error', (error) => {
      console.error('Error during payment verification:', error);
      return response.status(500).json({ message: 'Server error', error: error.message });
    });

    req.end(); // End the request
  } catch (error) {
    console.error('Error during payment verification:', error);
    return response.status(500).json({ message: 'Server error', error: error.message });
  }
};



// updateOrderToDelivered Function
const updateOrderToDelivered = async (request, response) => {
  try {
    const { orderId } = request.params; // Extract order ID from the request parameters

    // Find the order by its ID
    const order = await Order.findById(orderId);

    // If no order is found, return a 404 error
    if (!order) {
      return response.status(404).json({ message: "Order not found" });
    }

    // Check if the order is already delivered
    if (order.isDelivered) {
      return response
        .status(400)
        .json({ message: "Order is already delivered" });
    }

    // Update the order status
    order.isDelivered = true; // Set isDelivered to true
    order.deliveredAt = Date.now(); // Set the delivery timestamp

    // Save the updated order
    const updatedOrder = await order.save();

    // Return the updated order details
    response
      .status(200)
      .json({ message: "Order updated to delivered", order: updatedOrder });
  } catch (error) {
    // If there's an error, return a 500 server error
    response
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};



// getMyOrders Function
const getMyOrders = async (request, response) => {
  try {
    const { customerId } = request.params; // Extract customer ID from request params (or you could extract it from the authenticated user session)

    // Fetch orders for the given customer ID
    const orders = await Order.find({ customer: customerId }).populate(
      "orderItems.product",
      "name price"
    ); // Assuming product data is populated for better detail

    // If no orders are found, return a 404 error
    if (!orders || orders.length === 0) {
      return response
        .status(404)
        .json({ message: "No orders found for this customer" });
    }

    // Return the list of orders
    return response.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};


// getAllOrders Function
const getAllOrders = async (request, response) => {
  try {
    const order = await Order.find();

    // If no order is found, return a 404 error
    if (!order) {
      return response.status(404).json({ message: "Order not found" });
    }

    if (order && order.length > 0) {
      // Return a successful response with the list of users
      response.status(200).json({
        message: "Orders fetched successfully",
        order,
      });
    } else {
      // Return a message when no users are found
      response.status(404).json({ message: "No Orders found" });
    }
  } catch (error) {
    // If there's an error (e.g., invalid ID format), return a 500 server error
    response.status(500).json({ message: "Server error", error: error.message });
  }
};


// createCheckout Function
// const createCheckout = async (request, response) => {
//   try {
//     const { customer, orderItems, shippingAddress, paymentMethod, taxPrice = 0 } = request.body;

//     console.log('Request body:', request.body); // Log the request body for debugging

//     // Validate input
//     if (!customer || !orderItems || orderItems.length === 0 || !shippingAddress || !paymentMethod) {
//       return response.status(400).json({ message: 'All fields are required' });
//     }

//     // Validate that the payment method is allowed
//     const allowedPaymentMethods = ['Credit Card', 'PayPal', 'Bank Transfer'];
//     if (!allowedPaymentMethods.includes(paymentMethod)) {
//       return response.status(400).json({ message: 'Invalid payment method' });
//     }

//     // Check if products exist and calculate itemsPrice
//     let itemsPrice = 0;
//     const productIds = orderItems.map(item => item.product);
//     const existingProducts = await Product.find({ _id: { $in: productIds } });

//     console.log('Products found:', existingProducts); // Log the products found

//     // Validate each order item
//     for (const item of orderItems) {
//       const product = existingProducts.find(prod => prod._id.equals(item.product));
//       if (!product) {
//         return response.status(404).json({ message: `Product with ID ${item.product} not found` });
//       }
//       // Calculate total price for items
//       itemsPrice += product.price * item.quantity;
//     }

//     // Calculate shipping price (assumed to be a flat rate for this example)
//     const shippingPrice = 10.00; // Modify this based on your business logic

//     // Calculate total price (items price + tax + shipping)
//     const totalPrice = itemsPrice + taxPrice + shippingPrice;

//     // Create the order
//     const newOrder = new Order({
//       customer,
//       orderItems,
//       shippingAddress,
//       paymentMethod,
//       itemsPrice,
//       shippingPrice,
//       totalPrice,
//       taxPrice,
//     });

//     console.log('New order object:', newOrder); // Log the new order object

//     // Save the order to the database
//     const savedOrder = await newOrder.save();

//     // Log the saved order for confirmation
//     console.log('Order saved successfully:', savedOrder);

//     // Return the order details
//     return response.status(201).json({
//       message: 'Checkout successful',
//       order: savedOrder
//     });
//   } catch (error) {
//     console.error('Error during checkout:', error);
//     return response.status(500).json({ message: 'Internal server error', error: error.message });
//   }
// };

const createCheckout = async (request, response) => {
  try {
    const {
      customer,
      orderItems,
      shippingAddress,
      paymentMethod,
      taxPrice = 0,
      discountPrice = 0,
      shippingPrice = 10.0,
    } = request.body;

    // Validate input
    if (!customer || !orderItems || orderItems.length === 0 || !shippingAddress || !paymentMethod) {
      return response.status(400).json({ message: 'All fields are required' });
    }

    // Validate payment method
    const allowedPaymentMethods = ['Credit Card', 'PayPal', 'Bank Transfer'];
    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return response.status(400).json({ message: 'Invalid payment method' });
    }

    // Calculate itemsPrice
    let itemsPrice = 0;
    const productIds = orderItems.map(item => item.product);
    const existingProducts = await Product.find({ _id: { $in: productIds } });

    for (const item of orderItems) {
      const product = existingProducts.find(prod => prod._id.equals(item.product));
      if (!product) {
        return response.status(404).json({ message: `Product with ID ${item.product} not found` });
      }
      itemsPrice += product.price * item.quantity;
    }

    // Calculate totalPrice
    const totalPrice = itemsPrice + taxPrice + shippingPrice - discountPrice;

    // Create and save the new order
    const newOrder = new Order({
      customer,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      discountPrice,
      totalPrice,
    });

    const savedOrder = await newOrder.save();

    // Prepare payment request for Paystack
    const paymentData = JSON.stringify({
      email: customer.email, // Ensure customer has an email
      amount: totalPrice * 100, // Paystack expects amount in kobo
      currency: 'NGN',
      callback_url: 'http://yourcallbackurl.com/verify-payment', // Update with your callback URL
      metadata: {
        orderId: savedOrder._id, // Pass the order ID for verification
      },
    });

    // Options for the HTTP request
    const options = {
      hostname: 'api.paystack.co',
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // Your Paystack secret key
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(paymentData),
      },
    };

    // Make the HTTP request
    const req = http.request(options, (res) => {
      let data = '';

      // Listen for data
      res.on('data', (chunk) => {
        data += chunk;
      });

      // When the response ends
      res.on('end', () => {
        const paystackResponse = JSON.parse(data);
        if (paystackResponse.status) {
          return response.status(201).json({
            message: 'Checkout initiated successfully',
            paymentUrl: paystackResponse.data.authorization_url,
            order: savedOrder,
          });
        } else {
          return response.status(500).json({
            message: 'Failed to initiate payment',
            error: paystackResponse.message,
          });
        }
      });
    });

    // Handle error
    req.on('error', (error) => {
      console.error('Error during payment request:', error);
      return response.status(500).json({ message: 'Internal server error', error: error.message });
    });

    // Write data to request body
    req.write(paymentData);
    req.end();
  } catch (error) {
    console.error('Error during checkout:', error);
    return response.status(500).json({ message: 'Internal server error', error: error.message });
  }
};















module.exports = {
  createOrder,
  getOrderById,
  cancelOrder,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getAllOrders,
  createCheckout
};