const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mySecret = process.env['MONGO_URI'];
let BodyParser = require('body-parser');




let mongoose;
try { mongoose = require("mongoose"); } catch {
    (mongoose) } { console.log(mongoose) };

mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology:  true  });
//define schema
const Schema = mongoose.Schema;

//user schema
const usr_schm = new Schema({
    username: { type: String, required: true }
})
let user_Model = mongoose.model("user", usr_schm)


app.use(cors())
app.use(express.static('public'))

app.use("/", BodyParser.urlencoded({ extended: false }));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
    //let username= req.body.username;
    let new_user = user_Model({ username: req.body.username });
    new_user.save();
    res.json(new_user);
});

app.get('/api/users', (req, res) => {
    user_Model.find({}).then((users) => {
        res.json(users);
    })
})

//exercise schema
const exr_schm = new Schema({
    userId: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, default: new Date() }
})
let exr_Model = mongoose.model("exercise", exr_schm);


app.post('/api/users/:_id/exercises', (req, res) => {
    let userId = req.params._id;
    let exerObj = {
        userId: userId,
        description: req.body.description,
        duration: req.body.duration
    };

    if (req.body.date !== '') {
        exerObj.date = req.body.date;
    }

    let newExr = new exr_Model(exerObj);
    let userFound; // Declare userFound variable

    user_Model.findById(userId)
        .then(foundUser => {
            if (!foundUser) {
                throw new Error('User not found');
            }

            userFound = foundUser; // Assign the found user to userFound variable
            console.log(userFound);
            return newExr.save();
        })
        .then(() => {
            res.json({
                _id: userFound._id, // Use userFound variable here
                username: userFound.username,
                description: newExr.description,
                duration: newExr.duration,
                date: newExr.date.toDateString()
            });
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ error: 'Server error' });
        });
});

app.get('/api/users/:_id/logs', (req, res) => {
    let userId = req.params._id;
    let resObj = {};
    let limit = parseInt(req.query.limit);
    let from = req.query.from;
    let to = req.query.to;

    let query = { userId: userId };
    if (from && to) {
        query.date = { $gte: new Date(from), $lte: new Date(to) };
    } else if (from) {
        query.date = { $gte: new Date(from) };
    } else if (to) {
        query.date = { $lte: new Date(to) };
    }

    user_Model.findById(userId)
        .then(userFound => {
            if (!userFound) {
                throw new Error('User not found');
            }

            let username = userFound.username;
            let userId = userFound._id;
            resObj = {
                _id: userId,
                username: username,
            };

            return exr_Model.find(query).limit(limit).exec();
        })
        .then(exercises => {
            exercises = exercises.map((x) => {
                return {
                    description: x.description,
                    duration: x.duration,
                    date: x.date.toDateString()
                };
            });
            resObj.log = exercises;
            resObj.count = exercises.length;
            res.json(resObj);
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ error: 'Server error' });
        });
});






const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})