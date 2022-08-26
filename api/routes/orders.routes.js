const router = require('express').Router()
const checkout = require('../middleware/check-auth')
const OrdersController = require('../controllers/orders')

router.get('/', checkout, OrdersController.order_get_all)

router.post('/', checkout, OrdersController.order_create)

router.get('/:orderId', checkout, OrdersController.order_get_id)

router.delete('/:orderId', checkout, OrdersController.order_delete_id)

module.exports = router