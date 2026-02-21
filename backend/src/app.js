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


app.use("/api/auth", authRoutes)


module.exports = app