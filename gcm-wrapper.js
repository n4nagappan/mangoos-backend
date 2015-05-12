var gcm = require('node-gcm');
var sender;
var message = new gcm.Message({
        collapseKey: 'demo',
        delayWhileIdle: true,
        timeToLive: 1,
});

var gcmWrapper = {
    send: function(registrationIds, newData){
            console.log(registrationIds);
            message.data = newData;
            sender.send(message, registrationIds, function(err, result){
                if(err)
                    return console.error(err);
                console.log("Successfully sent to clients");
                console.log(result);
            });
    }
}


module.exports = function(key){
    sender = new gcm.Sender(key);
    return gcmWrapper;
}
