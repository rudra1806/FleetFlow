const express = require("express")
const router = express.Router()

const authController = require("../controllers/auth.controller")

// /api/auth/register
router.post("/register", authController.userRegisterController)

// /api/auth/login
router.post("/login", authController.userLoginController)

module.exports = router