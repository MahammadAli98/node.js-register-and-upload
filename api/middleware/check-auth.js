const jwt = require('jsonwebtoken')
require('dotenv/config')

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1]
        if (token === 'null') res.status(401).json({ message: 'You are not logged in!' })
        const decored = jwt.verify(token, process.env.ACS_TKN_SCT)
        req.userData = decored
        next()
    } catch (err) { res.status(401).json({ message: 'Invalid token' }) }
}