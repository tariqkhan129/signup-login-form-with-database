import express from 'express'
import cors from "cors"
import mongoose from 'mongoose'
import { stringToHash, varifyHash } from "bcrypt-inzi"

const app = express()
app.use(express.json());
app.use(cors());


const port = process.env.PORT || 3000;

const userSchema = new mongoose.Schema({

    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true },
    password: { type: String, required: true  },

    createdOn: { type: Date, default: Date.now },
});
const userModel = mongoose.model('User', userSchema);



app.post("/signup", (req, res) => {

    let body = req.body;

    if (!body.firstName
        || !body.lastName
        || !body.email
        || !body.password
    ) {
        res.status(400).send(
            `required fields missing, request example: 
                {
                    "firstName": "John",
                    "lastName": "Doe",
                    "email": "abc@abc.com",
                    "password": "12345"
                }`
        );
        return;
    }

    // check if user already exist // query email user
    userModel.findOne({ email: body.email }, (err, data) => {
        if (!err) {
            console.log("data: ", data);

            if (data) { // user already exist
                console.log("user already exist: ", data);
                res.status(400).send({ message: "user already exist,, please try a different email" });
                return;

            } else { // user not already exist

                stringToHash(body.password).then(hashString => {

                    userModel.create({
                        firstName: body.firstName,
                        lastName: body.lastName,
                        email: body.email.toLowerCase(),
                        password: hashString
                    },
                        (err, result) => {
                            if (!err) {
                                console.log("data saved: ", result);
                                res.status(201).send({ message: "user is created" });
                            } else {
                                console.log("db error: ", err);
                                res.status(500).send({ message: "internal server error" });
                            }
                        });
                })

            }
        } else {
            console.log("db error: ", err);
            res.status(500).send({ message: "db error in query" });
            return;
        }
    })
});


app.get("/users", async (req, res) => {

    try {
        let allUser = await userModel.find({}).exec();
        res.send(allUser);

    } catch (error) {
        res.status(500).send({ message: "error getting users" });
    }
})

app.post("/login", (req, res) => {

    let body = req.body;

    if (!body.email || !body.password) { // null check - undefined, "", 0 , false, null , NaN
        res.status(400).send(
            `required fields missing, request example: 
                {
                    "email": "abc@abc.com",
                    "password": "12345"
                }`
        );
        return;
    }

    let isFound = false; 

    for (let i = 0; i < userModel.length; i++) {
        if (userModel.email === body.email) {

            isFound = true;

            if (userModel.password === body.password) { // correct password

                res.status(200).send({
                    firstName: userModel.firstName,
                    lastName: userModel.lastName,
                    password : userModel.password,
                    message: "login successful",
                    token: "some unique token"
                })
                return;

            } else { // password incorrect

                res.status(401).send({
                    message: "incorrect password"
                })
                return;
            }
        }
    }

    if (!isFound) {
        res.status(404).send({
            message: "user not found"
        })
        return;
    }
})

//Login Database
// app.post("/login", (req, res) => {

//     let body = req.body;

//     if (!body.email || !body.password) {
//         res.status(400).send(
//             `Required fields missing, Request example:
//     {
//         "email": "abc@abc.com",
//         "password": "12345"
//     }`
//         );
//         return;
//     }
//     userModel.findOne({ email: body.email, password: body.password }, (err, data) => {
//         if (!err) {
//             console.log("data: ", data);

//             if (userModel.email === body.email) {
//                 if (userModel.password === body.password) {
//                     res.status(200).send({
//                         firstName: userModel.firstName,
//                         lastName: userModel.lastName,
//                         email: userModel.email,
//                         message: "login successful"
//                     })
//                     return;

//                 }
//                 else {
//                         res.status(401).send({
//                             message: "incorrect password"
//                         })
//                         return;

                    
//                 }
//             }
//         }
//         else {
//             console.log("db error: ", err);
//             res.status(500).send({ message: "db error in query" });
//         }
//     })
// })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})






/////////////////////////////////////////////////////////////////////////////////////////////////

let dbURI = 'mongodb+srv://tk:abc@cluster0.mpfwysq.mongodb.net/socialMediaBase?retryWrites=true&w=majority';
mongoose.connect(dbURI);

////////////////mongodb connected disconnected events///////////////////////////////////////////////
mongoose.connection.on('connected', function () {//connected
    console.log("Mongoose is connected");
});

mongoose.connection.on('disconnected', function () {//disconnected
    console.log("Mongoose is disconnected");
    process.exit(1);
});

mongoose.connection.on('error', function (err) {//any error
    console.log('Mongoose connection error: ', err);
    process.exit(1);
});

process.on('SIGINT', function () {/////this function will run jst before app is closing
    console.log("app is terminating");
    mongoose.connection.close(function () {
        console.log('Mongoose default connection closed');
        process.exit(0);
    });
});
////////////////mongodb connected disconnected events///////////////////////////////////////////////