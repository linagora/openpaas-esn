'use strict';

/* global chai, sinon: true */

var expect = chai.expect;

describe('The esnSearchQueryService service', function() {
  var esnSearchQueryService;

  beforeEach(function() {
    angular.mock.module('esn.search', 'jadeTemplates');
  });

  beforeEach(inject(function(_esnSearchQueryService_) {
    esnSearchQueryService = _esnSearchQueryService_;
  }));

  describe('The shouldKeepSearch function', function() {
    it('should return false when no searchKeeper returns true', function() {
      var keeper1 = sinon.stub().returns(false);
      var keeper2 = sinon.stub().returns(false);
      var toState = { name: 'op.main' };
      var toParams = { query: 'search' };
      var fromState = { name: 'op.child' };
      var fromParams = { query: 'search' };

      esnSearchQueryService.addSearchKeeper(keeper1);
      esnSearchQueryService.addSearchKeeper(keeper2);

      var keep = esnSearchQueryService.shouldKeepSearch(toState, toParams, fromState, fromParams);

      expect(keep).to.be.false;
      expect(keeper1).to.have.been.calledWith(toState, toParams, fromState, fromParams);
      expect(keeper2).to.have.been.calledWith(toState, toParams, fromState, fromParams);
    });

    it('should return true when at least one searchKeeper returns true', function() {
      var keeper1 = sinon.stub().returns(true);
      var keeper2 = sinon.stub().returns(false);
      var toState = { name: 'op.main' };
      var toParams = { query: 'search' };
      var fromState = { name: 'op.child' };
      var fromParams = { query: 'search' };

      esnSearchQueryService.addSearchKeeper(keeper1);
      esnSearchQueryService.addSearchKeeper(keeper2);

      var keep = esnSearchQueryService.shouldKeepSearch(toState, toParams, fromState, fromParams);

      expect(keep).to.be.true;
      expect(keeper1).to.have.been.calledWith(toState, toParams, fromState, fromParams);
      expect(keeper2).to.not.have.been.called;
    });
  });

  describe('The buildFromState function', function() {
    it('should fill text when q is defined', function() {
      var stateParams = {
        q: 'I am defined'
      };

      expect(esnSearchQueryService.buildFromState(stateParams)).to.shallowDeepEqual({
        text: stateParams.q
      });
    });

    it('should put an empty string in text when q is not defined', function() {
      var stateParams = {
      };

      expect(esnSearchQueryService.buildFromState(stateParams)).to.shallowDeepEqual({
        text: ''
      });
    });

    it('should fill advanced with input value when defined', function() {
      var stateParams = {
        a: { value: 'I am defined' }
      };

      expect(esnSearchQueryService.buildFromState(stateParams)).to.shallowDeepEqual({
        advanced: stateParams.a
      });
    });

    it('should put an empty object in advanced when a is not defined', function() {
      var stateParams = {
      };

      expect(esnSearchQueryService.buildFromState(stateParams)).to.shallowDeepEqual({
        advanced: {}
      });
    });
  });

  describe('The clear function', function() {
    it('should empty the text when defined', function() {
      var query = { text: 'I am defined' };

      expect(esnSearchQueryService.clear(query)).to.shallowDeepEqual({
        text: ''
      });
    });

    it('should empty the advanced object when defined', function() {
      var query = { advanced: { value: 'I am defined' }};

      expect(esnSearchQueryService.clear(query)).to.shallowDeepEqual({
        advanced: {}
      });
    });
  });

  describe('The isEmpty function', function() {
    it('should return true when query is empty', function() {
      expect(esnSearchQueryService.isEmpty({})).to.be.true;
    });

    it('should return true when text is empty and advanced is empty', function() {
      expect(esnSearchQueryService.isEmpty({ text: '', advanced: {}})).to.be.true;
    });

    it('should return false when text is not empty and advanced is empty', function() {
      expect(esnSearchQueryService.isEmpty({ text: 'I am not empty', advanced: {}})).to.be.false;
    });

    it('should return false when text is empty and advanced is not empty', function() {
      expect(esnSearchQueryService.isEmpty({ text: '', advanced: { value: 'I am not empty' }})).to.be.false;
    });
  });
});
