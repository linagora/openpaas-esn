'use strict';

var chai = require('chai');
var mockery = require('mockery');
var expect = chai.expect;

describe('The JWT auth webserver module', function() {

  describe('the optionsResolver function', function() {

    it('should resolve callback with error when getWebTokenConfig fails', function(done) {
      mockery.registerMock('../../core/auth/jwt', {
        getWebTokenConfig: function(callback) {
          return callback(new Error('expected error message'));
        }
      });

      this.helpers.requireBackend('webserver/auth/jwt-noauth').optionsResolver(err => {
        expect(err).to.deep.equal(new Error('expected error message'));

        done();
      });
    });

    it('should resolve callback using the given config', function(done) {
      mockery.registerMock('../../core/auth/jwt', {
        getWebTokenConfig: function(callback) {
          return callback(null, {
            publicKey: 'public key',
            algorithm: 'algo'
          });
        }
      });

      this.helpers.requireBackend('webserver/auth/jwt-noauth').optionsResolver((err, options) => {
        expect(err).to.equal(null);
        expect(options).to.deep.equal({
          secretOrKey: 'public key',
          tokenQueryParameterName: 'jwt',
          authScheme: 'Bearer',
          algorithms: ['algo'],
          ignoreExpiration: true
        });

        done();
      });
    });

  });

});
