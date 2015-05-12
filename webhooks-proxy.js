var restify = require('restify');
var webhooksListener= restify.createServer();
webhooksListener.use( restify.bodyParser());
webhooksListener.use( restify.queryParser() );

var pg = require('pg');
var conString;

var gcmWrapper = require('./gcm-wrapper.js').gcmWrapper;
var request = require('request');
var fs = require('fs');
var apiKey = fs.readFileSync('apiKey.json', 'utf8');
console.log(apiKey);
var baseRequest = request.defaults({
    headers : {
        'api_key' : apiKey 
    }
});
// restify middleware
// checks if the url exists in our database
var check = function(req, res, next){
    console.log(" Checking url : "+ req.params.url);
    var query = { url: encodeURIComponent(req.params.url) };
    var checkUrl = 'https://api.semantics3.com/test/v1/products?q=' + JSON.stringify(query) ;
    console.log(checkUrl);
    baseRequest( checkUrl , function(err, response, body){
        console.log("Response from semantics3 : " + response.statusCode );
        if(err)
            return next(err); 
        if( response.statusCode != 200){
            console.log("response for url check "+ body); 
            return next(new restify.InternalError());
        }
        var data = JSON.parse(body);
        if(data.results_count <= 0){
            console.log("Url check failed");
            return next(new restify.BadRequestError("The url doesn't exist in Semantics3 database"));
        }
        
        for( var i = 0; i < data.results[0].sitedetails.length ; ++i)
            if( data.results[0].sitedetails[i].url == req.params.url ){
                req.params.price = data.results[0].sitedetails[i].latestoffers[0].price;
                console.log(data.results[0]);
                req.params.sem3_id = data.results[0].sem3_id;
                req.params.url = data.results[0].sitedetails[i].url;
                break;
            }

        return next();
    });
};


var register = function(req, res, next){
    console.log("Registering with webhooks for url : " + req.params.url);
    var webhook_uri_id = '46ea5e1ca726ac3083f747ecc77ec4a2';
    var query = {
        "type": "price.decrease",
        "product": {
            "sem3_id": req.params.sem3_id 
        }
    };

    var registerUrl = 'https://api-staging.semantics3.com/test/v1/webhooks/mJlQM3MC';
    baseRequest.post( registerUrl , query , function(err, response, body){
        if(err)
            return next(err); 
        //console.log(body);
        if( response.statusCode != 200){
            console.log("Error adding webhook");
            console.log(body);
            return next(new restify.InternalError("Semantics3 API responded with non-200 response"));
        }

        console.log("Successfully added a webhook");
        var response = {};
        response.status = "ok" ;
        res.json(response);
    });

};


// Webhooks Listener
webhooksListener.listen(9090, function(){
    console.log("Webhooks Server listening...");
});

webhooksListener.post('/notify', function( req, res, next){
    console.log("Notification from Semantics3 webhooks server "+ JSON.stringify(req.params));
    pg.connect( conString , function( err, client , done){
        var newData = req.params.changes[0];
        console.log(newData.url);
        if(err)
            return console.log("error fetching client from pg pool");
        client.query( "select id from registrations where url=$1 ;", [newData.url], function(err, result){
            done();
            if(err){
                console.log(err);
                return next(err);
            } 
            console.log(result);

            var registrationIds = [];
            for( var i =0; i< result.rows.length; ++i)
                registrationIds.push(result.rows[i].id);

            //console.log(registrationIds);
            gcmWrapper.send(registrationIds, newData);
            res.send("ack");
        });
    });
});

module.exports = function(_conString){
    conString = _conString;
    return {
        check : check,
        register : register
    }
}
