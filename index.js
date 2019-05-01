var express = require('express');
var http = require('http');
var MongoClient = require('mongodb').MongoClient;
var app = express();
const url = "mongodb://localhost:27017/";
const dbname = 'parkingdb';
const bodyparser = require('body-parser');

app.use(express.static(__dirname+"/public"));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.get('/', (req, res)=>{
    res.sendFile(__dirname+'/public/index.html'); 
});

// register amd save information into database
app.post("/register",(req,res)=>{
   MongoClient.connect(url).then((client)=>{
   const db = client.db(dbname);
   const coll = db.collection('users');
   coll.insertOne({'name':req.body.name,'passwd':req.body.pass1});
   client.close();
   });
   res.sendFile(__dirname+"/public/login.html");
});

// check login details
app.post("/login",(req, res)=>{
  MongoClient.connect(url).then((client)=>{
     const db = client.db(dbname);
     const coll = db.collection('users');
     console.log("Username and password: "+req.body.name+", "+req.body.pass);
     const obj = coll.find({'name':req.body.name,'passwd':req.body.pass});
     return obj;
     while(docs.hasNext()){
         console.log(docs.next()); 
    }
   });
});

// komodo api calls
var request = require('request');
var headers = {'content-type': 'text/plain;'};
var dataString = (method,params)=>{return '{"jsonrpc": "1.0", "id":"curltest", "method":"'+method+'","params": ["'+params+'"] }'};

var options = (m,params)=>{
return {
    url: 'http://127.0.0.1:8668/',
    method: 'POST',
    headers: headers,
    body: dataString(m,params),
    auth: {
        'user': 'user677973848',
        'pass': 'passe5c65473ef0f27c1820cff4cae182ed08563b439b0dbeff26326f411432bb4b31f'
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
     request(options("getwalletinfo".req.body.txid), (err,response,body)=>{
           if(!err && response.statusCode==200){
	   	res.end(body);
	   }    
     });
});

app.post("/confirmtransaction",(req,res)=>{
  request(options(""

});

app.listen(3000, ()=>{
   console.log('Example app listening on port 3000!');
});

