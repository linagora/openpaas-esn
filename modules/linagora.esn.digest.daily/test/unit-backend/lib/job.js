'use strict';

var expect = require('chai').expect;
var q = require('q');
var mockery = require('mockery');

describe.only('The daily digest Job', function() {

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
    }
  };

  var dependencies = function(name) {
    return deps[name];
  };

  describe('The process function', function() {

    it('should transform digest json into a proper content send by om-email', function(done) {
      mockery.registerMock('./digest.json', require('../fixtures/digest.json'));
      module = require('../../../lib/job')(dependencies);
      module.process(function() {
        try {
          expect(
            JSON.stringify(resultedJson)).to.deep.equal(
            JSON.stringify(require('../fixtures/expected-digest-job-result.json')));
          done();
        } catch(err) {
          done(err);
        }
      });
    });

  });
});
