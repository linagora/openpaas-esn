'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.activitystream Angular module', function() {
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
