var express = require('express');
var http = require('http');
var MongoClient = require('mongodb').MongoClient;
var app = express();
var session = require('express-session');
var FileStore = require('session-file-store')(session);
const url = "mongodb://localhost:27017/";
const dbname = 'parkingdb';
const bodyparser = require('body-parser');

app.use(express.static(__dirname+"/public"));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(session({
   name:'session-id',
   secret: '12345678',
   saveUninitialized: false,
   resave: false,
   store: new FileStore()
}));

app.get('/', (req, res)=>{
    if(req.session.user==null){
       res.sendFile(__dirname+'/public/register.html'); 
    }
    else{
       res.redirect("/homepage");
    }
});

app.get("/pay4parking",(req,res)=>{
   if(req.session.user){
      res.sendFile(__dirname+"/public/pay4parking.html");
   }
   else{
     res.redirect("/loginpage");
   }
});

app.get("/loginpage",(req,res)=>{
   if(req.session.user){
      res.redirect("/homepage");
   }
   else{
     res.sendFile(__dirname+"/public/login.html");
   }
});

app.get("/homepage",(req,res)=>{
   if(req.session.user){
      res.sendFile(__dirname+"/public/homepage.html");
   }
   else{
      res.redirect("/loginpage");
   }
});

// register amd save information into database
app.post("/register",(req,res)=>{
   MongoClient.connect(url).then((client)=>{
   const db = client.db(dbname);
   const coll = db.collection('users');
   coll.insertOne({'name':req.body.name,'passwd':req.body.pass1});
   client.close();
   });
   res.redirect("/loginpage");
});


// check login details
app.post("/login",(req, res)=>{
  MongoClient.connect(url).then((client)=>{
     const db = client.db(dbname);
     const coll = db.collection('users');
     console.log("Username and password: "+req.body.name+", "+req.body.pass);
     coll.findOne({'name':req.body.name,'passwd':req.body.pass},(err,result)=>{
        if(result){
        req.session.user=req.body.name;
	res.redirect("/homepage");
	}
	else{
	res.redirect("/loginpage");
	}
    });
 });
});

// komodo api calls
var request = require('request');
var headers = {'content-type': 'text/plain;'};
var dataString = (method,params)=>{return '{"jsonrpc": "1.0", "id":"curltest", "method":"'+method+'","params": ["'+params+'"] }'};

var options = (m,params)=>{
return {
    url: 'http://127.0.0.1:9965/',
    method: 'POST',
    headers: headers,
    body: dataString(m,params),
    auth: {
        'user': 'user4008635038',
        'pass': 'passb729a205daa6a4f5008a9abb66a63b6e3680ca636aa7af2b352d0a1bf229f55b40'
    }
 }
};

app.get("/getaddress",(req,res)=>{
  request(options("getnewaddress",""),(err,response,body)=>{
     if(!err && response.statusCode==200){
	res.end(body);
     }
  });
});

app.post("/paymoney",(req,res)=>{
   MongoClient.connect(url).then((client)=>{
   const db = client.db(dbname);
   const coll = db.collection('parking');
   coll.insertOne({'plateno':req.body.plateno,'txid':req.body.txid,'name':'roopam'});
   client.close();
   res.end("<html><body>Parking spot confirmed successfully! <br/> <a href='/homepage'>Homepage</a></body></html>"); 
  });
});

app.post("/confirmtransaction",(req,res)=>{
   console.log(req.body.txid);
   request(options("gettransaction",req.body.txid),(err,response,body)=>{
  	var r = JSON.parse(body);
	if(r.result==null){
	   res.end("false");
	}
	else{
	  res.end("true");
	}
  });
});

app.listen(3001, ()=>{
   console.log('Example app listening on port 3001!');
});

