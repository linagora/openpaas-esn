'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The homePageService factory', function() {
  var esnModuleRegistry, homePageService;
  var modulesMock;

  beforeEach(function() {
    module('esn.home-page', function($provide) {
      $provide.value('esnI18nService', {
        translate: function(input) { return input; }
      });
    });

    modulesMock = [
      { homePage: 'a', title: 'A' },
      { homePage: 'b', title: 'B' }
    ];

    inject(function(_esnModuleRegistry_, _homePageService_) {
      esnModuleRegistry = _esnModuleRegistry_;
      homePageService = _homePageService_;
    });

    esnModuleRegistry.getAll = function() {
      return modulesMock;
    };
  });

  describe('The getHomePageCandidates fn', function() {
    it('should return a list homePage', function() {
      var expectResult = {a: 'A', b: 'B'};

      expect(homePageService.getHomePageCandidates()).to.deep.equal(expectResult);
    });
  });
});
