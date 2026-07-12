const http = require('http');
const data = JSON.stringify({email:'test@test.com',password:'test123'});
const req = http.request({hostname:'localhost',port:3000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':data.length}},res=>{
  let body='';
  res.on('data',c=>body+=c);
  res.on('end',()=>console.log(res.statusCode,body));
});
req.write(data);
req.end();
