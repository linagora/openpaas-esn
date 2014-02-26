'use strict';

var expect = require('chai').expect,
  mongoose = require('mongoose');

describe('The domain model module', function() {
  var Domain, User, emails, email, email2 = null;

  beforeEach(function(done) {
    this.testEnv.writeDBConfigFile();
    mongoose.connect(this.testEnv.mongoUrl);

    Domain = mongoose.model('Domain');

    User = mongoose.model('User');
    emails = [];
    email = 'foo@linagora.com';
    email2 = 'bar@linagora.com';

    done();
  });

  afterEach(function(done) {
    this.testEnv.removeDBConfigFile();
    mongoose.connection.db.dropDatabase();
    mongoose.disconnect(done);
  });

  describe('testCompany static method', function() {

    it('should return an domain object where company=company_name', function(done) {
      emails.push(email);
      emails.push(email2);
      var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});

      u.save(function(err, savedUser) {
        if (err) {
          done(err);
        }

        var dom = {
          name: 'Marketing',
          company_name: 'Foo Corporate',
          administrator: savedUser
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

});
