'use strict';

var expect = require('chai').expect;

describe('The collaboration module', function() {
  describe('query() method', function() {
    it('should fail if the collaboration objectType is unknown', function(done) {
      this.helpers.mock.models({});
      var collaboration = require(this.testEnv.basePath + '/backend/core/collaboration');
      collaboration.query('i dont exist', {}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call mongoose#find even when query is undefined', function(done) {
      this.helpers.mock.models({
        Community: {
          find: function() {
            done();
          }
        }
      });
      var collaboration = require(this.testEnv.basePath + '/backend/core/collaboration');
      collaboration.query('community', {}, function(err) {});
    });

    it('should call mongoose#find even when query is undefined', function(done) {
      var theQuery = {
        find: true,
        what: 'sushi'
      };
      this.helpers.mock.models({
        Community: {
          find: function(query) {
            expect(query).to.deep.equal(theQuery);
            done();
          }
        }
      });
      var collaboration = require(this.testEnv.basePath + '/backend/core/collaboration');
      collaboration.query('community', theQuery, function(err) {});
    });
  });
});
