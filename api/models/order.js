const mongoose = require('mongoose')

const orderSchema = mongoose.Schema({
    productID: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    quantity: { type: Number, default: 1 }
})

module.exports = mongoose.model('Order', orderSchema)