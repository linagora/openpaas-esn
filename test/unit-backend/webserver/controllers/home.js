'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');
const q = require('q');

describe('The home controller', function() {

  describe('The index function', function() {
    it('should set a valid express response', function(done) {
      const assets = {foo: 'bar'};
      const tplPath = '/my/template';
      const getFunctionMock = sinon.stub().returns(q.when('vi'));
      const esnAwareAppMock = sinon.stub().returns(assets);

      const alterMock = sinon.spy(function(path, cb) {
        cb(tplPath);
      });

      const esnConfigMock = function(key) {
        expect(key).to.equal('language');
        return {
          inModule: function(key) {
            expect(key).to.equal('core');
            return {
              forUser: function() {
                return {
                  get: getFunctionMock
                };
              }
            };
          }
        };
      };

      mockery.registerMock('../middleware/templates', {
        alterTemplatePath: alterMock
      });

      mockery.registerMock('../../core', {
        assets: {
          envAwareApp: esnAwareAppMock
        }
      });

      mockery.registerMock('../../core/esn-config', esnConfigMock);

      const index = this.helpers.requireBackend('webserver/controllers/home').index;
      const res = {
        locals: {},
        render: function(templatePath, options) {
          expect(alterMock).to.have.been.calledWith('esn/index', sinon.match.func);
          expect(res.locals.assets).to.deep.equal(assets);
          expect(templatePath).to.equal(tplPath);
          expect(getFunctionMock).to.have.been.called;
          expect(options).to.deep.equal({
            title: 'Home',
            locale: 'vi',
            fullLocale: 'vi-VN'
          });
          done();
        }
      };
      const req = {
        getLocale() {
          return 'vi';
        }
      };

      index(req, res);
    });
  });
});
