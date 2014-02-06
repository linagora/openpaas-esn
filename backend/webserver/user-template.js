'user strict';

function addUserTemplate(){
    var user = EsnConfig('templates', 'user');
    user.store(JSON.parse('./data/user-template.json'), function(err){
        if(err)
            return callback(err);
    });
}

module.exports.addUserTemplate = addUserTemplate();