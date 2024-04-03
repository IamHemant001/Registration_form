require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/user.js");
const Otp = require("./models/opt.js");
const path = require("path");
const methodOverride = require("method-override");
const nodemailer = require("nodemailer");
const {crypto,randomBytes, createHmac} = require('node:crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();

const PORT = process.env.PORT || 5000;

app.set("views",path.join(__dirname,"views"));
app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({extended : true}));
app.use(methodOverride("_method"));

// Mongoose
async function main() {
    await mongoose.connect(process.env.MONGO_URL);
}
  
main().then(res=>console.log("Connection Successful"))
.catch(err => console.log(err));  

app.get("/register",(req,res)=>{
    res.render("register.ejs");
});

app.get("/login",(req,res)=>{
    res.render("login.ejs");;
});


app.post("/register",async (req,res)=>{
    let {firstName,lastName,age,email,phone,password,confirmpassword} = req.body;
    try {
        await User.create({
          firstName,
          lastName,
          age,
          email,
          phone,
          password,
          confirmpassword 
        }).then((res)=>{
            console.log(res);
        }).catch((err)=>{
            console.log(err);
        });
        res.send("Registered Successful");
      } catch (err) {
        console.error(err);
      }
});  

app.post("/login",async (req,res)=>{
    let {email,password} = req.body;
    try{
        const user = await User.matchPassword(email,password);
        console.log("User: ",user);
        res.send("login Successful");
    }catch(err){
        res.render("Error.ejs");
    }
});

// forget password route
app.get("/forgetPassword",(req,res)=>{
    res.render("forgetPassword.ejs");
});

app.post("/forgetPassword",async (req,res)=>{
    const {email} = req.body;
    const user1 = User.findOne({email : email}).then((res)=>{
        if(!user1){
            return res.send("User does not exits");
        }
        let otpcode = Math.floor((Math.random()*10000) + 1);
        let newotp = new Otp({
            email : email,
            code : otpcode,
            expireIn : new Date().getTime() + 300*1000
        })
        
        newotp.save().then((res)=>{
            console.log("Chek your email id");
        }).catch((err) =>{
            console.log("Error:",err);
        });
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'ar.lifts007@gmail.com',
                pass: 'eamq otgz qksc vkqa'
            }
        });
        
        let mailOptions = {
            from: 'ar.lifts007@gmail.com',
            to: email,
            subject: "Reset your password", 
            text: `your otp is: ${otpcode}`, 
        };
        
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    })
    const user = await User.findOne({email : email});
    const id = user._id.toString()
    console.log(user._id.toString());
    res.render("verify.ejs",{id});
});

app.post("/verify/:id",async (req,res)=>{
    let {id} = req.params;
    let {otp} = req.body;
    let data = await Otp.find({code : otp})
    if(data){
        let currentTime = new Date().getTime();
        let diff = data.expireIn - currentTime;
        if(diff < 0){
            console.log("Time Expried");
            }else{
                console.log("otp verified");
                res.redirect(`/resetPassword/${id}`);           
        }
        }else{
            res.send("Wrong otp");
        }
    });
    
    app.get("/resetPassword/:id",async (req,res)=>{
        let {id} = req.params;
        res.render("resetPassword.ejs",{id});
        
    });
       
    app.put("/check/:id", async (req, res) => {
        const { id } = req.params;
        const { password } = req.body;
    
        try {
            const hashPassword = async (pass) => {
                try {
                    const salt = randomBytes(16).toString('hex');
                    const hashedPassword = createHmac("sha256", salt).update(pass).digest("hex");
                    return { salt, hashedPassword };
                } catch (error) {
                    console.error('Error hashing password:', error);
                    throw error;
                }
            };
    
            const { salt, hashedPassword } = await hashPassword(password);

            await User.findByIdAndUpdate(id, { salt, password: hashedPassword });
    
            console.log("Password Changed Successfully");
            res.redirect('/login');
        } catch (err) {
            console.error('Error changing password:', err);
            res.status(500).send('Internal Server Error');
        }
    });
    
    app.listen(PORT,()=>{
        console.log("App is listening on the port",PORT);
    });