const router = require('express').Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv/config')
const User = require('../models/user')


const genAcsToken = (user) => { return jwt.sign({ sub: user.id }, process.env.ACS_TKN_SCT, { expiresIn: process.env.ACS_TKN_EXP }) }
const genRfsToken = (user) => { return jwt.sign({ sub: user.id }, process.env.RFS_TKN_SCT, { expiresIn: process.env.RFS_TKN_EXP }) }




router.post('/singup', async (req, res) => {

    const email = await User.findOne({ email: req.body.email })
    if (email) return res.status(409).json({ error: 'Email already exists' })

    const user = new User({
        username: (req.body.username).trim(),
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10, (err, hash) => err ? err : hash)
    })

    try {
        await user.save()
        const acsToken = genAcsToken(user)
        const rfsToken = genRfsToken(user)

        User.findByIdAndUpdate(user.id, { $set: { refreshTokens: rfsToken } }).exec()

        res.json({ success: true, acsToken, rfsToken })
    } catch (err) { res.status(500).json({ success: err }) }
})




router.post('/login', async (req, res, next) => {

    const user = await User.findOne({ email: req.body.email })
    if (!user) res.status(400).json({ message: 'Email not found' })

    const ValiPassword = await bcrypt.compare(req.body.password, user.password)
    if (!ValiPassword) res.status(400).json({ message: 'Password is incorrect' })

    try {
        const acsToken = genAcsToken(user)
        const refreshToken = genRfsToken(user)
        User.findByIdAndUpdate(user._id, { $push: { refreshTokens: refreshToken } }).exec()
        res.status(200).json({ message: `User logged in ${user.username}`, acsToken, refreshToken })
    } catch (err) { res.status(500).json({ message: err.message }) }
})




router.post('/refreshtoken', async (req, res) => {

    const rfsToken = req.body.token
    if (!rfsToken) return res.status(400).json({ error: 'Token is required' })

    try {
        const user = await User.findOne({ refreshTokens: rfsToken })
        if (!user) return res.status(400).json({ error: 'Token is invalid' })
        const Jwtpayload = jwt.verify(rfsToken, process.env.RFS_TKN_SCT)
        const acsToken = genAcsToken({ id: Jwtpayload.sub })
        res.json({ success: true, acsToken })
    } catch (error) { return res.status(401).json({ error: error.message }) }
})




router.delete('/logout', async (req, res) => {
    const rfsToken = req.body.token
    if (!rfsToken) return res.status(400).json({ error: 'Token is required' })

    try {
        const Jwtpayload = jwt.verify(rfsToken, process.env.RFS_TKN_SCT)
        const user = await User.findById(Jwtpayload.sub)
        const refreshTokens = user.refreshTokens.filter(t => t !== rfsToken)
        User.findOneAndUpdate(user._id, { $set: { refreshTokens } }).exec()
        res.json({ success: true })
    } catch (error) { return res.status(401).json({ error: error.message }) }
})




router.delete('/:id', async (req, res) => {
    User.findOne({ _id: req.params.id })
        .then(async (user) => {
            if (!user) res.status(400).json({ message: 'User alread deleted' })
            else {
                try {
                    const result = await User.deleteOne(req.params.id)
                    res.json({ message: 'User deleted', result })
                } catch (err) { res.status(500).json({ message: err.message }) }
            }
        })
})

module.exports = router