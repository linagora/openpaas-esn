'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The controlcenterGeneralController', function() {

  var $controller, $rootScope, $scope;
  var asyncAction, esnUserConfigurationService, homePageService, CONTROLCENTER_GENERAL_CONFIGS;

  beforeEach(function() {
    asyncAction = sinon.spy(function(message, action) {
      return action();
    });

    module('linagora.esn.controlcenter');
    module('esn.home-page');
    module('esn.async-action');

    module(function($provide) {
      $provide.value('asyncAction', asyncAction);
    });
  });

  beforeEach(function() {
    inject(function(_$window_, _$controller_, _$rootScope_, _esnUserConfigurationService_, _homePageService_, _CONTROLCENTER_GENERAL_CONFIGS_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      esnUserConfigurationService = _esnUserConfigurationService_;
      homePageService = _homePageService_;
      CONTROLCENTER_GENERAL_CONFIGS = _CONTROLCENTER_GENERAL_CONFIGS_;
    });
  });

  function initController(scope) {
    $scope = scope || $rootScope.$new();

    var controller = $controller('controlcenterGeneralController', { $scope: $scope });

    $scope.$digest();

    return controller;
  }

  it('should build list configurations with not blank "homePage" value from server on init', function() {
    var configs = [{ name: 'homePage', value: 'home-page' }, { name: 'key1', value: 'value1' }, { name: 'key2', value: 'value2' }];
    var expectResult = { homePage: 'home-page', key1: 'value1', key2: 'value2' };

    esnUserConfigurationService.get = sinon.stub().returns($q.when(configs));

    var controller = initController();

    controller.$onInit();
    $rootScope.$digest();

    expect(controller.configurations).to.deep.equal(expectResult);
    expect(esnUserConfigurationService.get).to.have.been.calledWith(CONTROLCENTER_GENERAL_CONFIGS);
  });

  it('should build list configurations with default "homePage" value "unifiedinbox" if get blank value from server on init', function() {
    var configs = [{ name: 'homePage' }, { name: 'key1', value: 'value1' }, { name: 'key2', value: 'value2' }];
    var expectResult = { homePage: 'unifiedinbox', key1: 'value1', key2: 'value2' };

    esnUserConfigurationService.get = sinon.stub().returns($q.when(configs));

    var controller = initController();

    controller.$onInit();
    $rootScope.$digest();

    expect(controller.configurations).to.deep.equal(expectResult);
    expect(esnUserConfigurationService.get).to.have.been.calledWith(CONTROLCENTER_GENERAL_CONFIGS);
  });

  it('should get a list homePages with keys are sorted', function() {
    var homePages = { a: 'a', f: 'f', b: 'b'};
    var expectResult = { a: 'a', b: 'b', f: 'f' };

    esnUserConfigurationService.get = function() { return $q.when([]); };
    homePageService.getHomePageCandidates = sinon.stub().returns(homePages);

    var controller = initController();

    controller.$onInit();
    $rootScope.$digest();

    expect(controller.homePages).to.deep.equal(expectResult);
    expect(homePageService.getHomePageCandidates).to.have.been.calledOnce;
  });

  describe('The save fn', function() {
    var configMock;

    beforeEach(function() {
      configMock = [{ name: 'homePage', value: 'home-page' }, { name: 'language', value: 'en' }, { name: 'key2', value: 'value2' }];

      esnUserConfigurationService.get = function() {
        return $q.when(configMock);
      };
    });

    it('should call esnUserConfigurationService.set to save configuration', function(done) {
      esnUserConfigurationService.get = sinon.stub().returns($q.when(configMock));

      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();

      esnUserConfigurationService.set = sinon.stub().returns($q.when());

      controller.save().then(function() {
        expect(esnUserConfigurationService.set).to.have.been.calledWith(configMock);
        done();
      });

      $scope.$digest();
    });

    it('should call registered saving handlers in sequence', function(done) {
      esnUserConfigurationService.set = sinon.stub().returns($q.when());
      esnUserConfigurationService.get = function() { return $q.when([]); };
      var handler1 = sinon.stub().returns($q.when());
      var handler2 = sinon.stub().returns($q.when());

      var controller = initController();

      controller.$onInit();
      $scope.$digest();

      controller.registerSaveHandler(handler1);
      controller.registerSaveHandler(handler2);
      controller.save().then(function() {
        expect(esnUserConfigurationService.set).to.have.been.called;
        expect(handler1).to.have.been.calledAfter(esnUserConfigurationService.set);
        expect(handler2).to.have.been.calledAfter(handler1);
        done();
      });

      $scope.$digest();
    });

    it('should call async action with a custom messages and options in case of needing a reload after save configuration', function(done) {
      esnUserConfigurationService.get = function() { return $q.when(configMock); };
      esnUserConfigurationService.set = sinon.stub().returns($q.when());

      var controller = initController();

      controller.$onInit();
      $rootScope.$digest();

      controller.configurations.language = 'fr';

      controller.save().then(function() {
        expect(asyncAction).to.have.been.calledWith(
          {
            progressing: 'Saving configuration...',
            success: 'Configuration saved. Click on \'Reload\' to apply changes',
            failure: 'Failed to save configuration'
          },
          sinon.match.func,
          {
            onSuccess: {
              linkText: 'Reload',
              action: sinon.match.func
            }
          }
        );
        expect(esnUserConfigurationService.set).to.have.been.called;

        done();
      }).catch(done);

      $rootScope.$digest();
    });
  });
});
