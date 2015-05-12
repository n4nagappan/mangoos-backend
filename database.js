var restify = require('restify');
var pg = require('pg');
var conString;

db = {};
db.users = {
    create : function(user){
        pg.connect( conString , function( err, client , done){
            if(err)
                return console.log("error fetching client from pg pool");
            client.query( ' insert into users values( $1 ); ', [user], function(err, result){
                done();
                if(err)
                    return console.error("could not insert into db");
                
                console.log("Successfully inserted to db");
            });
        });
    }
}

db.registrations = {
    read: function(req, res, next){
        var id = req.params.id ; 
        var query;
        if( req.params.url )
            query = "select url,price from registrations where id = '" + id + "' and url = '" + req.params.url +"'";
        else
            query = "select url,price from registrations where id = '" + id + "'";

        //console.log(query);
        //console.log("Fetching registrations for id : " + id);
        pg.connect( conString , function( err, client , done){
            if(err)
                return console.log("error fetching client from pg pool");
            client.query( query, function(err, result){
                done();
                if(err){
                    return console.error("could not select from db");
                } 
                //console.log("Successfully fetched from db");
                var response = {};
                response.status = "ok" ;
                response.result = result.rows;
                res.json(response);
            });
        });
    },
    create : function(req, res, next){
        var id = req.params.id ;
        var url = req.params.url; 
        var price = req.params.price; 
        pg.connect( conString , function( err, client , done){
            if(err)
                return console.log("error fetching client from pg pool");
            client.query( ' insert into registrations values( $1, $2, $3 ); ', [id, url, price], function(err, result){
                done();
                if(err){
                    console.log("error while inserting into registrations table : "+ err);
                    if( err['code'] == '23505' ){
                        return next( new restify.BadRequestError("Duplicate Entry. Failed to insert to DB"));
                    }

                    return next( new restify.InternalError());
                } 
                console.log("Successfully inserted to db");
                next();
            });
        });
    },
    del: function(req, res, next){
        var id = req.params.id ;
        var url = req.params.url; 
        pg.connect( conString , function( err, client , done){
            if(err)
                return console.log("error fetching client from pg pool");
            client.query( " delete from registrations where id = $1 and url = $2; ", [id, url], function(err, result){
                done();
                if(err){
                    return next(err);
                } 
                console.log("Successfully deleted from db");
                next();
            });
        });
    }
}

module.exports = function(_conString){
    conString = _conString;
    return db;
};
