'use strict';

const expect = require('chai').expect;
const q = require('q');

describe('The esn-config/fallback module', function() {

  var getModule;

  before(function() {
    this.testEnv.writeDBConfigFile();
  });

  after(function() {
    this.testEnv.removeDBConfigFile();
  });

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    this.connectMongoose(this.mongoose, done);

    getModule = this.helpers.requireBackend.bind(this.helpers, 'core/esn-config/fallback');
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  describe('The findByDomainId fn', function() {

    var saveDoc;

    beforeEach(function() {
      saveDoc = this.helpers.mongo.saveDoc.bind(this.helpers.mongo);
    });

    it('should get documents from configuration, features and configurations then merge to one', function(done) {
      var mongoConfigDoc = { _id: 'mail', mail: 'mail-mongoconfig' };
      var featuresDoc = {
        modules: [{
          name: 'configurations',
          features: [{
            name: 'ldap',
            value: { ldap: 'ldap-features' }
          }]
        }, {
          name: 'contact',
          features: [{
            name: 'contact-config',
            value: 'contact-value'
          }]
        }]
      };
      var configDoc = {
        modules: [{
          name: 'core',
          configurations: [{
            name: 'mail',
            value: { mail: 'mail-configurations' }
          }]
        }, {
          name: 'inbox',
          configurations: [{
            name: 'inbox-config',
            value: 'inbox-value'
          }]
        }]
      };

      q.all([
        q.nfcall(saveDoc, 'configuration', mongoConfigDoc),
        q.nfcall(saveDoc, 'features', featuresDoc),
        q.nfcall(saveDoc, 'configurations', configDoc)
      ])
      .then(getModule().findByDomainId)
      .then(function(doc) {
        expect(doc).to.deep.equal({
          modules: [{
            name: 'core',
            configurations: [{
              name: 'ldap',
              value: { ldap: 'ldap-features' }
            }, {
              name: 'mail',
              value: { mail: 'mail-configurations' }
            }]
          }, {
            name: 'contact',
            configurations: [{
              name: 'contact-config',
              value: 'contact-value'
            }]
          }, {
            name: 'inbox',
            configurations: [{
              name: 'inbox-config',
              value: 'inbox-value'
            }]
          }]
        });
        done();
      });

    });

  });

});
