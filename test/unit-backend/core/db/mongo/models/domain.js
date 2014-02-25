'use strict';

var expect = require('chai').expect,
  mongoose = require('mongoose');

describe('The domain model module', function() {
  var Domain = null;

  beforeEach(function(done) {
    this.testEnv.writeDBConfigFile();
    mongoose.connect(this.testEnv.mongoUrl);
    Domain = mongoose.model('Domain');
    done();
  });

  afterEach(function(done) {
    this.testEnv.removeDBConfigFile();
    mongoose.connection.db.dropDatabase();
    mongoose.disconnect(done);
  });

  describe('testCompany static method', function() {

    it('should return an domain object where company=company_name', function(done) {
      var dom = {
        name: 'Marketing',
        company_name: 'Foo Corporate'
      };

      var i = new Domain(dom);
      i.save(function(err, data) {
        if (err) {
          done(err);
        }
        Domain.testCompany(data.company_name, function(err, domain) {
          expect(err).to.not.exist;
          expect(domain).to.exist;
          done();
        });
      });
    });
  });

});
