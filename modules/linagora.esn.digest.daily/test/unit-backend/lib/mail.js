'use strict';

var expect = require('chai').expect;
var q = require('q');

describe('The daily digest mail builder', function() {

  var module, resultedJson;

  var deps = {
    digesttracker: {},
    email: {
      getMailer: function() {
        return {
          sendHTML: function(message, templateName, content) {
            resultedJson = {
              message: message,
              templateName: templateName,
              content: content
            };

            return q();
          }
        };
      }
    }
  };

  var dependencies = function(name) {
    return deps[name];
  };

  describe('The process function', function() {
    var digest = require('../fixtures/digest.json');
    var user = require('../fixtures/user.json');

    it('should reject if configHelpers cannot get base_url', function(done) {
      deps.helpers = {
        config: {
          getBaseUrl: function(user, callback) {
            callback(new Error('something error'));
          }
        }
      };
      module = require('../../../lib/mail')(dependencies);
      module.process(user, digest).catch(function(err) {
        expect(err.message).to.equal('something error');
        done();
      });
    });

    it('should transform digest json into a proper content send by om-email', function() {
      deps.helpers = {
        config: {
          getBaseUrl: function(user, callback) {
            callback(null, 'http://test:12345');
          }
        }
      };
      module = require('../../../lib/mail')(dependencies);
      return module.process(user, digest).then(function() {
        return expect(
          JSON.stringify(resultedJson)).to.deep.equal(
          JSON.stringify(require('../fixtures/expected-digest-job-result.json')));
      });
    });
  });
});
