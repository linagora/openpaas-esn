'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The user helpers module', function() {
  var userMock = {};
  var domainMock = {};

  function setupMock() {
    userMock.get = function(id, callback) {
      return callback(null, {});
    };
    userMock.belongsToCompany = function(user, company, callback) {
      return callback(null, false);
    };
    domainMock.load = function(id, callback) {
      return callback(null, {});
    };
  }

  beforeEach(function() {
    setupMock();
    mockery.registerMock('../core/user', userMock);
    mockery.registerMock('../core/domain', domainMock);
  });

  describe('the getUserIds fn', function() {
    it('should send back an error if user is undefined', function(done) {
      this.helpers.requireBackend('helpers/user').isInternal(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should return true if the user (given by id) is internal', function(done) {
      userMock.get = function(id, callback) {
        expect(id).to.equal('123');
        return callback(null, {
          domains: [{
            domain_id: '456'
          }]
        });
      };
      userMock.belongsToCompany = function(user, company, callback) {
        expect(company).to.equal('linagora');
        return callback(null, true);
      };
      domainMock.load = function(id, callback) {
        expect(id).to.equal('456');
        return callback(null, {
          company_name: 'linagora'
        });
      };

      this.helpers.requireBackend('helpers/user').isInternal('123', function(err, isInternal) {
        expect(err).to.not.exist;
        expect(isInternal).to.be.true;
        done();
      });
    });

    it('should return true if the user (given by object) is internal', function(done) {
      var user = {
        domains: [{
          domain_id: '456'
        }]
      };
      userMock.get = function() {
        return done(new Error('Should not pass here'));
      };
      userMock.belongsToCompany = function(user, company, callback) {
        expect(company).to.equal('linagora');
        return callback(null, true);
      };
      domainMock.load = function(id, callback) {
        expect(id).to.equal('456');
        return callback(null, {
          company_name: 'linagora'
        });
      };

      this.helpers.requireBackend('helpers/user').isInternal(user, function(err, isInternal) {
        expect(err).to.not.exist;
        expect(isInternal).to.be.true;
        done();
      });
    });
  });
});
