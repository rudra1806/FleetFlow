const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const app = express()
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"], credentials: true }))

app.use(express.json())
app.use(cookieParser())

app.get("/", (req, res) => {
    res.send("Welcome to Bank API 🏦");
});

const authRoutes = require("./routes/auth.routes")
const accountRoutes = require("./routes/account.routes")
const transactionRoutes = require("./routes/transaction.routes")

app.use("/api/auth", authRoutes)
app.use("/api/account", accountRoutes)
app.use("/api/transaction", transactionRoutes)

module.exports = app