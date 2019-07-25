const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const ejs = require('ejs');
const bodyParser = require('body-parser')

//connect to DB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true }, (error, client) => {
	console.log("Successfully connected to MongoDB");
})
app.use(cors());

//parse POST bodies
app.set("view engine", "ejs"); 
app.set("views", __dirname + "/views"); 
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('public'))
app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// // Not found middleware
// app.use((req, res, next) => {
//   return next({status: 404, message: 'not found'})
// })

// // Error Handling middleware
// app.use((err, req, res, next) => {
//   let errCode, errMessage

//   if (err.errors) {
//     // mongoose validation error
//     errCode = 400 // bad request
//     const keys = Object.keys(err.errors)
//     // report the first validation error
//     errMessage = err.errors[keys[0]].message
//   } else {
//     // generic or custom error
//     errCode = err.status || 500
//     errMessage = err.message || 'Internal Server Error'
//   }
//   res.status(errCode).type('txt')
//     .send(errMessage)
// })


//workout record schema
const Schema = mongoose.Schema;
const workoutSchema = new Schema({
  userName:{type:String},
  userid: { type: String},
  secretcode:{ type: String},
  workout:  { type : Array , "default" : [] },
});
let Workout = mongoose.model('Record', workoutSchema);

//creating new user
app.post('/api/exercise/new-user', (req, res) => {
  let username = req.body.username
  let secretcode = req.body.secretcode
  //check if the user name is existed. if not, create new user
  Workout.findOne({userName:username}, function (err, data){
    if (err) {
      throw err
      } else {
        if(!data){
          //create new user name
          let userid = username + Math.floor(Math.random() *1000);
          let newUser = new Workout({
            userName: username,
            userid: userid,
            secretcode: secretcode,
          })
          //save new url
          newUser.save(function(err, data){
            if (err) {
              throw err
              }
          });
          res.render('index.ejs', {message1: "Your user ID is: " + userid, message2:""});
        }else if (username==data.userName && secretcode==data.secretcode){
          res.render('index.ejs', {message1: "*Your user ID is: " + data.userid, message2:""});
        }else{
          res.render('index.ejs', {message1: "*Username already taken.", message2:""});
        }
      };
  });  
});

//adding usear records
app.post('/api/exercise/add', (req, res) => {
  let userid = req.body.userId;
  // let workoutToAdd = [{description : req.body.description},
  //                     {duration : req.body.duration},
  //                     {date : Date(req.body.date)},];
  let workoutToAdd = [req.body.description,
                      req.body.duration,
                      new Date(req.body.date),];
  //check if the user name is existed. if not, create new user
  Workout.findOne({userid:userid}, function (err, data){
    if (err) {
      throw err
      } else {
        if(!data){
          res.render('index.ejs', {message1: "Your ID is not registered. Please create a new user.", message2:"Forgot user id? Type user name and secret code to check!"});
        }else{
          data.workout.push(workoutToAdd)
          data.save(function(err, data){
            if (err) {
              throw err
              }
          });
          res.render('index_submit.ejs', {record_userid:userid, record_username:req.body.date.username, record_description: req.body.description, record_duration:req.body.duration, record_date:req.body.date});
        };
        
      }
  })
});
         
//view log
app.post('/api/exercise/log', (req, res) => {
  let userid = req.body.userId;
  let username = req.body.username;
  let startdate = new Date(req.body.startdate);
  let enddate = new Date(req.body.enddate);
  let record = [];
  Workout.findOne({userid:userid}, function (err, data){
    if (err) {
      throw err
      } else {
        if(!data){
          res.render('index.ejs', {message1: "Your ID is not registered. Please create a new user.", message2:"Forgot user id? Type user name and secret code to check!"});
        }else{
          data.workout.map((log)=>{
            if(log[2] >= startdate && log[2] <= enddate){
              let date = log[2].toString().slice(3,15);
              let Description = log[0];
              let Duration = log[1]
              let oneRecord = [date, Description, Duration]
              record.push(oneRecord)
            }
          });
          record.sort(function(a,b){
          return new Date(a[0]) - new Date(b[0]);
            });
            res.render('index_log.ejs', {record: record, userid: userid, startdate: startdate.toString().slice(3,15), enddate:enddate.toString().slice(3,15)});
        }
      }
  })

  
//   res.json({greeting: 'hello API'});
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
