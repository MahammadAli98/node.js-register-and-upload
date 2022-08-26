const router = require('express').Router()
const Product = require('../models/product')
const checkout = require('../middleware/check-auth')
const multer = require('multer')

const storage = multer.diskStorage({ destination: function (req, file, cb) { cb(null, './uploads/') }, filename: function (req, file, cb) { cb(null, Date.now() + file.originalname) } })

const fileFilter = (req, file, cb) => { (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') ? cb(null, true) : cb(null, false) }

const upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 5 }, fileFilter: fileFilter })



router.get('/', (req, res) => {
    Product.find()
        .select('name price _id productImage')
        .then(docs => {
            const page = req.query.page || 1
            const limit = req.query.limit || 5
            const startIndex = (page - 1) * limit
            const endIndex = page * limit
            const paginatedProducts = docs.slice(startIndex, endIndex)
            const response = {
                count: paginatedProducts.length,
                products: paginatedProducts.map(doc => {
                    return {
                        name: doc.name,
                        price: doc.price,
                        _id: doc._id,
                        productImage: doc.productImage,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:5000/products/' + doc._id
                        }
                    }
                })
            }
            res.json(response)
        }).catch(err => res.status(500).json({ error: err }))
})



router.post('/', checkout, upload.single('productImage'), async (req, res) => {
    Product.findOne({ name: req.body.name })
        .then(async (product) => {
            if (product) res.status(400).json({ message: 'Product already exists' })
            else {
                const product = new Product({
                    name: req.body.name,
                    price: req.body.price,
                    productImage: req.file.path
                })
                try {
                    const result = await product.save()
                    res.status(201).json({
                        message: 'Created product successfully',
                        createdProduct: {
                            name: result.name,
                            price: result.price,
                            _id: result._id,
                            productImage: result.productImage,
                            request: {
                                type: 'GET',
                                url: 'http://localhost:5000/products/' + result._id
                            }
                        }
                    })
                } catch (err) { res.status(500).json({ error: err }) }
            }
        })
})



router.get('/:productId', async (req, res, next) => {
    await Product.findById(req.params.productId)
        .then(doc => { (doc) ? res.json(doc) : res.status(404).json({ message: 'No valid entry found for provided ID' }) })
})




router.patch('/:productId', (req, res, next) => {
    const updateOps = {}
    for (const ops of req.body) { updateOps[ops.propName] = ops.value }
    Product.updateOne({ _id: req.params.productId }, { $set: updateOps })
        .then(result => {
            res.json({
                message: 'Product updated',
                request: {
                    type: 'GET',
                    url: 'http://localhost:5000/products/' + req.params.productId
                }
            })
        }).catch(err => res.status(500).json({ error: err }))
})



router.delete('/:productId', async (req, res, next) => {
    const productfind = await Product.findOne({ _id: req.params.productId })

    if (!productfind) res.status(404).json({ message: 'No valid entry found for provided ID' })

    try {
        await productfind.deleteOne()
        res.json({ message: 'Product deleted' })
    } catch (err) { res.status(500).json({ error: err }) }
})

module.exports = router