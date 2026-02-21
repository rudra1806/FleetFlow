const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema({
    email:
    {
        type: String,
        required: [true,
            "Email is Required"],
        trim: true,
        lowercase: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            "Invalid Email Format"],
        unique: [true, "Email Already Exists"]
    },
    name:
    {
        type: String,
        required: [true,
            "Name is Required"],
        trim: true,
        lowercase: true,
    },
    password:
    {
        type: String,
        required: [true,
            "Password is Required"],
        trim: true,
        minlength: [6,
            "Password must be at least 6 characters long"],
        select: false
    },
    systemUser: {
        type: Boolean,
        default: false,
        immutable: true,
        select: false
    }
},
    {
        timestamps: true
    }
);


userSchema.pre('save', async function (next) {

    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }

    return
})

userSchema.methods.comparePassword = async function (password) {
    // console.log(password, this.password)
    return await bcrypt.compare(password, this.password)
}


const userMode = mongoose.model('User', userSchema)

module.exports = userMode