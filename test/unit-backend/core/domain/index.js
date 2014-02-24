'use strict';

var expect = require('chai').expect,
  mongodb = require('mongodb'),
  mongoose = require('mongoose');

describe('The domain core module', function() {
  var domainModule = null;

  beforeEach(function(done) {
    this.testEnv.writeDBConfigFile();
    mongoose.connect(this.testEnv.mongoUrl);
    domainModule = require(this.testEnv.basePath + '/backend/core').domain;
    done();
  });

  afterEach(function(done) {
    this.testEnv.removeDBConfigFile();
    mongoose.connection.db.dropDatabase();
    mongoose.disconnect(done);
  });

  describe('isCompanyExist method', function() {

    it('should return an domain object where company=company_name', function(done) {
      var domain = {
        name: 'Marketing',
        company_name: 'Foo Corporate'
      };

      var companyExists = function() {
        domainModule.testCompany('Foo Corporate', function(err, company) {
          expect(err).to.be.null;
          expect(company).to.exist;
          expect(company).to.be.an.object;
          done();
        });
      };

      mongodb.MongoClient.connect(this.testEnv.mongoUrl, function(err, db) {
        if (err) {
          return done(err);
        }
        db.collection('domains').insert(domain, companyExists);
      });
    });
  });

});
