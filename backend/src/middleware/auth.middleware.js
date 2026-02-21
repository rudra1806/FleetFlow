const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1]
        if (!token) {
            return res.status(401).json({
                message: "Unauthorized",
                status: false
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await userModel.findById(decoded.id).select("+systemUser")
        if (!user) {
            return res.status(401).json({
                message: "Unauthorized",
                status: false
            })
        }
        req.user = user
        next()
    } catch (error) {
        console.error("Error in auth middleware:", error)
        res.status(500).json({
            message: "Internal server error",
            status: false
        })
    }
}

const authSystemUserMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1]
        if (!token) {
            return res.status(401).json({
                message: "Unauthorized",
                status: false
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await userModel.findById(decoded.id).select("+systemUser")
        if (!user) {
            return res.status(401).json({
                message: "Unauthorized Access 1",
                status: false
            })
        }
        if (!user.systemUser) {
            return res.status(401).json({
                message: "Unauthorized Access 2",
                status: false
            })
        }
        req.user = user
        next()
    } catch (error) {
        console.error("Error in auth middleware:", error)
        res.status(500).json({
            message: "Internal server error",
            status: false
        })
    }
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
}