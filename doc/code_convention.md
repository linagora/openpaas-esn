# Code Convention

In backend and fronted a module name is singular. For example, the module which manage

* users must be called `user`
* communities must be called `community`

## Backend

### Core

#### Model Mongoose

* Use `creator` to specify the creator or author
* Use `timestamps` to store all dates like:
    * creation
    * finalization
    * expiration
    * adhesion

Skeleton:

    var mongoose = require('mongoose'),
     Schema = mongoose.Schema;
    
    var ModelSchema = new Schema({
      creator: {type: Schema.ObjectId, ref: 'User'},
      timestamps: {
        creation: {type: Date, default: Date.now}
      },
      schemaVersion: {type: Number, default: 1}
    }, {collection: 'models'});
    
    module.exports = mongoose.model('Model', ModelSchema);


#### CRUD in MongoDB

* When error use logger.error.
* When success use logger.debug.

Skeleton:

    var mongoose = require('mongoose'),
      Model = mongoose.model('Model');

    function save(callback) {
      var model = new Model();
      model.save(function (err, saved) {
        if (err) {
          logger.error('Error while trying to provision model in database:', err.message);
          return callback(err);
        }
        logger.debug('Model provisioned in database: ' + saved._id);
        return callback(null, saved);
      });
    }


### Webserver

#### Route

If the route is a REST endpoint, use `/api/...`
Use middleware to validate a route and controller to execute the request.

## Frontend

In factory, use english terms (prefix) to describe what the function does:

* GET request    : get, search, list, download
* POST request   : create, upload
* PUT request    : update, upload
* DELETE request : remove

A factory must manage **one** resource.

* module name is: esn.*moduleName*
* factory name is : *moduleName*API

Skeleton:

    angular.module('esn.module', [
      'restangular'
    ])
      .factory('moduleAPI', ['Restangular', function(Restangular) {
        function get(id) {
          return Restangular.one('module/' + id).get();
        }
        function post(content) {
          return Restangular.one('module').post(content);
        }
        return {
          get: get,
          post: post
        };
      }])
      .directive('moduleDirective', function() {
        return {
          restrict: 'E',
          replace: true,
          templateUrl: '/views/modules/moduleName/module.html'
        };
      })
      .controller('moduleController', ['$scope', 'moduleAPI', function($scope, moduleAPI) {
        
      }]);

## Documentation

See `REST_skeleton.md`.