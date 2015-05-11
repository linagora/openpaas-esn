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
    'esn-config': function() {
      return {
        get: function(key, callback) {
          return callback(null, { noreply: 'noreply@open-paas.org' });
        }
      };
    }
  };

  var dependencies = function(name) {
    return deps[name];
  };

  describe('The process function', function() {

    it('should transform digest json into a proper content send by om-email', function(done) {
      var digest = require('../fixtures/digest.json');
      var user = require('../fixtures/user.json');
      module = require('../../../lib/mail')(dependencies);
      module.process(user, digest).then(function() {
        try {
          expect(
            JSON.stringify(resultedJson)).to.deep.equal(
            JSON.stringify(require('../fixtures/expected-digest-job-result.json')));
          done();
        } catch (err) {
          done(err);
        }
      });
    });

  });
});
