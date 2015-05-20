'use strict';

var expect = require('chai').expect;
var q = require('q');

describe('The daily digest mail builder', function() {

  var module, resultedJson;

  var deps = {
    'digesttracker': {},
    'content-sender': {
      send: function(from, to, content, options) {
        var defer = q.defer();
        resultedJson = {
          from: from,
          to: to,
          content: content,
          options: options
        };
        defer.resolve();
        return defer.promise;
      }
    },
    'esn-config': function(id) {
      function EsnConfigInstance(id) {
        this.id = id;
      }
      EsnConfigInstance.prototype.get = function(key, callback) {
        if (typeof key === 'function') {
          callback = key;
          key = null;
        }
        if (this.id === 'mail') {
          return callback(null, { noreply: 'noreply@open-paas.org' });
        } else if (this.id === 'web') {
          return callback(null, { base_url: 'http://test:12345' });
        } else {
          return callback(new Error('id must be mail or web'));
        }
      };
      return new EsnConfigInstance(id);
    },
    config: function() {
      return {
        webserver: {port: 8080}
      };
    }
  };

  var dependencies = function(name) {
    return deps[name];
  };

  describe('The process function', function() {

    it('should transform digest json into a proper content send by om-email', function() {
      var digest = require('../fixtures/digest.json');
      var user = require('../fixtures/user.json');
      module = require('../../../lib/mail')(dependencies);
      return module.process(user, digest).then(function() {
        return expect(
          JSON.stringify(resultedJson)).to.deep.equal(
          JSON.stringify(require('../fixtures/expected-digest-job-result.json')));
      });
    });

  });
});
