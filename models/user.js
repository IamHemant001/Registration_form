const mongoose = require("mongoose");
const {crypto,randomBytes, createHmac} = require('node:crypto');

const userSchema = new mongoose.Schema({
    firstName : {
        type : String,
        required : true
    },
    lastName : {
        type : String,
        required : true
    },
    age : {
        type : Number,
        required : true
    },
    email : {
        type : String,
        unique : true,
        required : true
    },
    salt : {
        type : String
    },
    phone : {
        type : Number,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    confirmpassword : {
        type : String,
        required : true
    },
    code : {
        type : String,
        default : ''
    },
    profile : {
        type : String,
        default : "/images/user_avatar.png"
    },
    role : {
        type : String,
        enum : ["USER","ADMIN"],
        default : "USER"
    }
},{timestamps : true});


userSchema.pre("save",function (next){
    const user = this;
    if(!user.isModified("password")) return next();

    const salt = randomBytes(16).toString('hex');
    const hashedPassword = createHmac("sha256",salt).update(user.password).digest("hex");
    
    this.salt  = salt;
    this.password = hashedPassword;
    this.confirmpassword = hashedPassword;
    next();
});

userSchema.static("matchPassword",async function(email,password){
    const user =await this.findOne({email});
    if(!user) throw new Error ("User not found");
    const salt = user.salt;
    const hashedPassword = user.password;

    const userProvidedHash = createHmac("sha256",salt)
        .update(password)
        .digest("hex");
    if(hashedPassword !== userProvidedHash)throw new Error ("Incorrect password");
    return user;
})

userSchema.static("matchPassword",async function(email,password){
    const user =await this.findOne({email});
    if(!user) throw new Error ("User not found");
    const salt = user.salt;
    const hashedPassword = user.password;

    const userProvidedHash = createHmac("sha256",salt)
        .update(password)
        .digest("hex");
    if(hashedPassword !== userProvidedHash)throw new Error ("Incorrect password");
    return user;
});

const User = mongoose.model("User",userSchema);
module.exports = User;