'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.activitystream Angular module', function() {
  describe('activitystreamMessageDecorator service', function() {

    beforeEach(function() {
      this.msgAPI = {
        get: function() {}
      };

      var self = this;

      angular.mock.module('esn.activitystream');
      angular.mock.module(function($provide) {
        $provide.value('messageAPI', self.msgAPI);
      });
    });

    beforeEach(inject(function(activitystreamMessageDecorator, $rootScope, $q) {
      this.decorator = activitystreamMessageDecorator;
      this.$rootScope = $rootScope;
      this.$q = $q;
    }));

    it('should be a function', function() {
      expect(this.decorator).to.be.a.function;
    });

    it('should return a function', function() {
      var instance = this.decorator(function() {});
      expect(instance).to.be.a.function;
    });

    it('should forward any error', function(done) {
      var instance = this.decorator(function(err) {
        expect(err).to.equal('ERROR');
        done();
      });
      instance('ERROR');
    });

    it('should call messageAPI.get with according ids', function(done) {
      var tl = [
        {object: { _id: 'ID5' }},
        {object: { _id: 'ID2' }}
      ];
      this.msgAPI.get = function(options) {
        expect(options).to.deep.equal({'ids[]': ['ID5', 'ID2']});
        done();
      };
      var instance = this.decorator(function() { });
      instance(null, tl);
    });

    it('should forward messageAPI.get error', function(done) {
      var tl = [
        {object: { _id: 'ID5' }},
        {object: { _id: 'ID2' }}
      ];
      var d = this.$q.defer();
      d.reject({data: 'ERROR'});
      this.msgAPI.get = function(options) {
        return d.promise;
      };
      var instance = this.decorator(function(err) {
        expect(err).to.equal('ERROR');
        done();
      });
      instance(null, tl);
      this.$rootScope.$digest();
    });

    it('should return an error if some messages cannot be fetched', function(done) {
      var tl = [
        {object: { _id: 'ID5' }},
        {object: { _id: 'ID2' }}
      ];

      var msgResp = [
        {_id: 'ID5', objectType: 'whatsup' },
        {error: 404, message: 'Not found', details: 'message ID2 could not be found'}
      ];
      var d = this.$q.defer();
      d.resolve({data: msgResp});
      this.msgAPI.get = function(options) {
        return d.promise;
      };
      var instance = this.decorator(function(err) {
        expect(err.code).to.equal(400);
        expect(err.message).to.equal('message download failed');
        expect(err.details).to.be.an.array;
        expect(err.details).to.have.length(1);
        done();
      });
      instance(null, tl);
      this.$rootScope.$digest();
    });

    it('should return the decorated timeline object', function(done) {
      var tl = [
        {object: { _id: 'ID5' }},
        {object: { _id: 'ID2' }}
      ];

      var msgResp = [
        {_id: 'ID5', objectType: 'whatsup', content: 'yolo' },
        {_id: 'ID2', objectType: 'whatsup', content: 'lgtm' }
      ];
      var d = this.$q.defer();
      d.resolve({data: msgResp});
      this.msgAPI.get = function(options) {
        return d.promise;
      };
      var instance = this.decorator(function(err, response) {
        expect(response).to.deep.equal([
          {object: {_id: 'ID5', objectType: 'whatsup', content: 'yolo' }},
          {object: {_id: 'ID2', objectType: 'whatsup', content: 'lgtm' }}
        ]);
        done();
      });
      instance(null, tl);
      this.$rootScope.$digest();
    });


  });

  describe('activitystreamAPI service', function() {

    beforeEach(function() {
      angular.mock.module('esn.activitystream');
    });
    beforeEach(inject(function(activitystreamAPI, $httpBackend) {
      this.api = activitystreamAPI;
      this.$httpBackend = $httpBackend;
    }));

    describe('get method', function() {
      it('should exist', function() {
        expect(this.api).to.respondTo('get');
      });

      it('should send a request GET /activitystreams/:uuid', function() {
        this.$httpBackend.expectGET('/activitystreams/test').respond([]);
        this.api.get('test');
        this.$httpBackend.flush();
      });

      it('should send a request GET /activitystreams/:uuid, allowing passing some options', function() {
        this.$httpBackend.expectGET('/activitystreams/test?before=someID&limit=30').respond([]);
        this.api.get('test', {before: 'someID', limit: 30});
        this.$httpBackend.flush();
      });
    });
  });

  describe('activitystreamFilter service', function() {

    beforeEach(function() {
      angular.mock.module('esn.activitystream');
    });
    beforeEach(inject(function(activitystreamFilter) {
      this.filter = activitystreamFilter;
    }));

    it('should be a function', function() {
      expect(this.filter).to.be.a.function;
    });

    it('should return an object with filter, addToSentList and addToRemovedList methods', function() {
      var f = this.filter();
      expect(f).to.respondTo('filter');
      expect(f).to.respondTo('addToSentList');
      expect(f).to.respondTo('addToRemovedList');
    });

    describe('filter method', function() {
      it('should respond true for a new timeline entry', function() {
        var f = this.filter();
        var tle = {
          verb: 'post',
          object: {
            _id: 'ID1'
          }
        };
        expect(f.filter(tle)).to.be.true;
      });

      it('should respond false for a new timeline entry having the verb remove', function() {
        var f = this.filter();
        var tle = {
          verb: 'remove',
          object: {
            _id: 'ID1'
          }
        };
        expect(f.filter(tle)).to.be.false;
      });

      it('should respond false for a new timeline entry it already knows', function() {
        var f = this.filter();
        var tle = {
          verb: 'post',
          object: {
            _id: 'ID1'
          }
        };
        f.filter(tle);
        expect(f.filter(tle)).to.be.false;
      });

      it('should respond false for a new timeline entry it already knows and that was "remove"d', function() {
        var f = this.filter();
        var tle = {
          verb: 'post',
          object: {
            _id: 'ID1'
          }
        };
        var tle2 = {
          verb: 'remove',
          object: {
            _id: 'ID1'
          }
        };
        f.filter(tle2);
        expect(f.filter(tle)).to.be.false;
      });
    });

  });

});
