var express = require('express');
var http = require('http');
var MongoClient = require('mongodb').MongoClient;
var app = express();
var session = require('express-session');
var FileStore = require('session-file-store')(session);
const url = "mongodb://localhost:27017/";
const dbname = 'parkingdb';
const bodyparser = require('body-parser');

app.use(express.static(__dirname+"/node_modules/qrcode"));
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

app.get("/logout",(req,res)=>{
  req.session.destroy();
  res.redirect("/loginpage");
});

/// komodo api calls
var request = require('request');
var headers = {'content-type': 'text/plain;'};
var dataString = (method,params)=>{
	return '{"jsonrpc": "1.0", "id":"curltest", "method":"'+method+'","params":['+params+']}';
};


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
// register amd save information into database
app.post("/register",(req,res)=>{
   MongoClient.connect(url).then((client)=>{
   const db = client.db(dbname);
   const coll = db.collection('users');
   coll.insertOne({'name':req.body.name,'passwd':req.body.pass1});
   client.close();
   });
   var params = ['"'+req.body.pubadd+'"',20, '"donation"','"sean outpost"'];
   console.log(options("sendtoaddress",params));
   if(req.body.pubadd!=""){
   request(options("sendtoaddress",params),(err,response,body)=>{
     console.log(body);
   }); 
   }
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
	client.close();
	res.redirect("/homepage");
	}
	else{
	client.close();
	res.redirect("/loginpage");
	}
    });
 });
});

app.get("/confirmed",(req,res)=>{
   if(req.session.booking){
     delete req.session.booking;
     res.sendFile(__dirname+"/public/confirmed.html");
   }
   else{
     res.redirect("/homepage");
   }
});

app.get("/getaddress",(req,res)=>{
  request(options("getnewaddress",[""]),(err,response,body)=>{
     if(!err && response.statusCode==200){
	res.end(body);
     }
  });
});

app.post("/verifytransaction",(req,res,next)=>{
  req.session.stime = req.body.stime;
  req.session.etime = req.body.etime;
  req.session.plateno = req.body.plateno; 
   next()},(req,res)=>{
    res.redirect("/confirm");  
 });

app.get("/confirm",(req,res)=>{
   if(req.session.plateno){
       res.sendFile(__dirname+"/public/confirm.html");
   }
   else{
       res.redirect("/pay4parking");
   }
});

app.post("/paymoney",(req,res)=>{
   MongoClient.connect(url).then((client)=>{
   const db = client.db(dbname);
   const coll = db.collection('parking');
   coll.insertOne({'date':new Date(Date.now()).toISOString().substr(0,10),'plateno':req.session.plateno,'txid':req.body.txid,'name':req.session.user,'stime':req.session.stime,'etime':req.session.etime});
   client.close();
   delete req.session.plateno;
   req.session.booking = "true";
   res.redirect("/confirmed"); 
  });
});

app.post("/confirmtransaction",(req,res)=>{
	console.log(options("gettransaction",'"'+req.body.txid+'"'));
	request(options("gettransaction",'"'+req.body.txid+'"'),(err,response,body)=>{
  	var r = JSON.parse(body);
	console.log(r);
	if(r.result==null){
	   res.end("false");
	}
	else{
	  if(r.result.details[0].address==req.body.address){
	  	res.end("true");}
	else{
	res.end("false");
	}
	}
  });
});

app.post("/validateuser",(req,res)=>{
  console.log("called validateuser");
  MongoClient.connect(url).then((client)=>{
     const db = client.db(dbname);
     const coll = db.collection('users');
     coll.findOne({'name':req.body.username},(err,result)=>{
	if(result==null){
	   res.end("true");
	}
	else{
	 res.end("false");
    }
   });
  });
});

app.get("/gethistory",(req,res)=>{
  if(req.session.user==null){
  	res.redirect("/");
  }
 else{
  MongoClient.connect(url).then((client)=>{
     const db = client.db(dbname);
     const coll = db.collection('parking');
     coll.find({'name':req.session.user}).toArray((err,result)=>{
     	var htmlcode = '<html><head><title>Park Chain</title><link rel="stylesheet" type="text/css" href="css/style.css"/></head><body>	<div class="header"><a class="logo" href="/">ParkChain</a><input type="button" class="btnclass logout" onclick="location.href='+"'/logout'"+'" value="Log out"/></div><div class="body"><a class="home" href="/"><span>&#x2190;</span>Back</a><table id="tblhist"><th>Date</th><th>From</th><th>To</th><th>Plate Number</th>';
	for(var i=0;i<result.length;i++){
	    htmlcode+="<tr><td>"+result[i].date+"</td><td>"+result[i].stime+"</td><td>"+result[i].etime+"</td><td>"+result[i].plateno+"</td></tr>";
	}
	htmlcode+="</table></div></body></html>";
	res.send(htmlcode);
    });
  });
 }
});

app.listen(3001, ()=>{
   console.log('Example app listening on port 3001!');
});

