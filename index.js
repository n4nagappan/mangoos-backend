var restify = require('restify');
var nconf = require('nconf');
nconf.file('./config.json');

var conString = nconf.get('postgres');
var db = require('./database.js')(conString);
var webhooksProxy = require('./webhooks-proxy.js')(conString);
var key = nconf.get('gcm-api-key');
var gcmWrapper = require('./gcm-wrapper.js')(key);

var server = restify.createServer();
server.use( restify.bodyParser());
server.use( restify.queryParser() );

server.get('/test', function( req, res, next){
    console.log("Request received , params " + JSON.stringify(req.params) );
    res.send("Hello world");
});

server.get('/', function( req, res, next){
    console.log("Request received , params " + JSON.stringify(req.params) );
    res.send(req.params.verification_code);
});

server.get('/check', function( req, res, next){
    console.log("GET Request received , params " + JSON.stringify(req.params));
    if(!req.params.url)
        return next( new restify.InvalidArgumentError("url missing in the parameters provided") );
    next();
},
webhooksProxy.check,
function( req, res, next){
    res.json({ status: "ok", message : "The url exists in Semantics3 database" });    
});

server.get('/registrations', function( req, res, next){
    console.log("GET Request received , params " + JSON.stringify(req.params));
    if(!req.params.id)
        return next( new restify.InvalidArgumentError("id missing in the parameters provided") );
    next();
},db.registrations.read);

server.post('/registrations',webhooksProxy.check,  function( req, res, next){
    console.log("POST Request received , params " + JSON.stringify(req.params));
    if(!req.params.id || !req.params.url)
        return next( new restify.InvalidArgumentError("Either ID or URL missing in the parameters provided") );
    next();
},webhooksProxy.register, db.registrations.create );

server.del('/registrations', function( req, res, next){
    console.log("DELETE Request received , params " + JSON.stringify(req.params));
    if(!req.params.id)
        return next( new restify.InvalidArgumentError("id missing in the parameters provided") );
    next();
},db.registrations.del, function(req, res, next){
    res.json({status :"ok"});
});

server.listen(8080, function(){
    console.log("Server listening...");
});
