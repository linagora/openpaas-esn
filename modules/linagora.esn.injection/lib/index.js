'use strict';

function injectLib(dependencies) {
  var domainModule = dependencies('domain');
  var communityModule = dependencies('community');

  var lib = {};

  lib.inject = function(tuple, injections, callback) {
    if (!tuple.objectType || !tuple.id) {
      return callback(new Error('Injection target should be a valid pair objectType/objectId.'));
    }

    if (tuple.objectType === 'domain') {
      domainModule.load(tuple.id, function(err, domain) {
        if (err) {
          return callback(err);
        }
        domain.injections = domain.injections.concat(injections);
        domain.save(callback);
      });
    } else if (tuple.objectType === 'community') {
      communityModule.load(tuple.id, function(err, community) {
        if (err) {
          return callback(err);
        }
        injections.forEach(function(injection) {
          community.injections.push(injection);
        });
        community.save(community, callback);
      });
    } else {
      return callback(new Error('Unsupported injection target type.'));
    }
  };

  lib.removeInjections = function(application, target, callback) {
    if (!target.objectType || !target.id) {
      return callback(new Error('Injection target should be a valid pair objectType/objectId.'));
    }

    if (target.objectType === 'domain') {
      domainModule.load(target.id, function(err, domain) {
        if (err) {
          return callback(err);
        }
        var otherTargetInjections = domain.injections.filter(function(injection) {
          return injection.source.id + '' !== application._id + '';
        });
        domain.injections = otherTargetInjections;
        domain.save(callback);
      });
    } else if (target.objectType === 'community') {
      communityModule.load(target.id, function(err, community) {
        if (err) {
          return callback(err);
        }
        var otherTargetInjections = community.injections.filter(function(injection) {
          return injection.source.id + '' !== application._id + '';
        });
        community.injections = otherTargetInjections;
        community.save(community, callback);
      });
    } else {
      return callback(new Error('Unsupported injection target type.'));
    }
  };

  return lib;
}

module.exports = injectLib;
