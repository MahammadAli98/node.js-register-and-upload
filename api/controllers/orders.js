const Order = require('../models/order')
const Product = require('../models/product')


exports.order_get_all = (req, res, next) => {
    Order.find()
        .select('productID quantity _id productName ')
        .then((product) => {
            const response = {
                count: product.length,
                products: product.map(doc => {
                    return {
                        productID: doc.productID,
                        productName: doc.productName,
                        quantity: doc.quantity,
                        _id: doc._id,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:5000/orders/' + doc._id
                        }
                    }
                })
            }
            res.json(response)
        }).catch(err => res.status(500).json({ error: err }))
}



exports.order_create = async (req, res, next) => {
    await Product.findById(req.body.productID)
        .then(product => {
            if (!product) { return res.status(404).json({ message: 'Product not found' }) }
            const order = new Order({
                productID: req.body.productID,
                productName: product.name,
                quantity: req.body.quantity
            })
            order.save()
                .then(result => {
                    res.status(201).json({
                        message: 'Order added successfully',
                        createdOrder: result._id
                    })
                }).catch(err => res.status(500).json({ error: err }))
        })
}



exports.order_get_id = (req, res, next) => {
    const orderId = req.params.orderId
    Order.findById(orderId)
        .then(order => {
            (order)
                ? res.json({
                    _id: order._id,
                    productID: order.productID,
                    productName: order.productName,
                    quantity: order.quantity,
                    request: {
                        type: 'GET',
                        url: 'http://localhost:5000/orders/' + order._id
                    }
                }) : res.status(404).json({ message: 'Not Found order' })
        }).catch(err => res.status(500).json({ error: err }))
}



exports.order_delete_id = (req, res, next) => {
    const orderId = req.params.orderId
    Order.remove({ _id: orderId })
        .then(result => res.status(200).json({ message: 'Order deleted' }))
        .catch(error => res.status(500).json({ message: 'Deleting a order failed' }))
}