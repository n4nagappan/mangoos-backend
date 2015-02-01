var restify = require('restify');

var server = restify.createServer();
server.use( restify.bodyParser());
server.use( restify.queryParser() );

server.get('/test', function( req, res, next){
    console.log("Request received , params " + req.params.q );
    res.send("Hello world");
});

server.get('/test', function( req, res, next){
    console.log("Request received , params " + req.params.q );
    res.send("Hello world");
});

server.post('/test', function( req, res, next){
    console.log("Request received , params " + req.params.q );
    res.send("Hello world");
});

server.post('/register', function( req, res, next){
    console.log("Request received , params " + req.params.q );
    var response = {};
    response.status = "ok" ;
    res.json(response);
});

server.listen(8080, function(){
    console.log("Server listening...");
});
