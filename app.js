const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv/config')
const mongoose = require('mongoose')

mongoose.connect(process.env.DB_CONNECT, { useUnifiedTopology: true }, () => { console.log('Connected to DB'); return app.listen(process.env.PORT, () => { console.log('Server Started') }) })

app.use(express.json(), cors())

app.use('/api/users', require('./api/routes/user.routes'))
app.use('/api/orders', require('./api/routes/orders.routes'))
app.use('/api/products', require('./api/routes/products.routes'))