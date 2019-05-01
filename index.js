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
     request(options("getwalletinfo",req.body.txid), (err,response,body)=>{
           if(!err && response.statusCode==200){
	   	res.end(body);
	   }    
     });
});

app.post("/confirmtransaction",(req,res)=>{
  request(options("gettransaction",req.body.txid),(err,response,body)=>{
  	if(body.result==null){
	   res.end("false");
	}
	else{
	  console.log(body);
	  return "true";
	}
  });
});

app.listen(3001, ()=>{
   console.log('Example app listening on port 3000!');
});

