'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The contact Angular module directives', function() {

  beforeEach(function() {
    angular.mock.module('ngRoute');
    angular.mock.module('esn.core');
    angular.mock.module('esn.websocket');
    angular.mock.module('esn.api-notification');
    angular.mock.module('linagora.esn.contact');
    angular.mock.module('esn.alphalist');
    module('jadeTemplates');
  });

  describe('inlineEditableInput', function() {

    beforeEach(inject(['$compile', '$rootScope', '$timeout', 'DEFAULT_AVATAR', function($c, $r, $t, DEFAULT_AVATAR) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.$scope = this.$rootScope.$new();
      this.$timeout = $t;
      this.DEFAULT_AVATAR = DEFAULT_AVATAR;

      this.initDirective = function(scope) {
        var html = '<inline-editable-input input-class="aClass" type="aType" placeholder="aPlaceholder" ng-model="aModel" on-blur="aBlurFunction" on-save ="aSaveFunction"/>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        return element;
      };
    }]));

    it('should bind on focus that toggle the group buttons', function() {
      var element = this.initDirective(this.$scope);
      var input = element.find('input');
      input.appendTo(document.body);
      input.focus();
      var scope = element.isolateScope();
      this.$timeout.flush();
      expect(scope.showGroupButtons).to.be.true;
    });

    it('should bind on blur and call saveInput if old value !== new value of ng-model controller', function(done) {
      this.$scope.aModel = 'value';
      this.$scope.aSaveFunction = done;
      var element = this.initDirective(this.$scope);
      var input = element.find('input');
      input.appendTo(document.body);
      input.blur();
      this.$timeout.flush();
    });

    it('should bind on blur and do not call saveInput if old value === new value', function(done) {
      this.$scope.aModel = undefined;
      this.$scope.aSaveFunction = function() {
        done(new Error('should not be called'));
      };
      this.$scope.aBlurFunction = done;
      var element = this.initDirective(this.$scope);
      var input = element.find('input');
      input.appendTo(document.body);
      input.blur();
      this.$timeout.flush();
    });

    it('should bind on blur, toggle the group buttons and call onBlur after 200 ms', function(done) {
      var scope;
      this.$scope.aModel = 'value';
      this.$scope.aSaveFunction = function() {};
      this.$scope.aBlurFunction = function() {
        expect(scope.showGroupButtons).to.be.true;
        done();
      };
      var element = this.initDirective(this.$scope);
      var input = element.find('input');
      input.appendTo(document.body);
      input.blur();
      scope = element.isolateScope();
      this.$timeout.flush();
    });

    it('should bind on keydown and call resetInput if escape is the event', function(done) {
      var element = this.initDirective(this.$scope);
      var input = element.find('input');
      input.appendTo(document.body);
      var scope = element.isolateScope();
      scope.resetInput = done;
      var escape = $.Event('keydown');
      escape.which = 27;
      input.trigger(escape);
      this.$timeout.flush();
    });

  });

  describe('The contactPhoto directive', function() {

    var element;

    beforeEach(function() {
      element = this.$compile('<contact-photo contact="contact"></contact-photo>')(this.$scope);
    });

    it('should use the default avatar if contact.photo is not defined', function() {
      this.$scope.$digest();

      expect(element.find('img').attr('src')).to.equal(this.DEFAULT_AVATAR);
    });

    it('should use the contact photo if defined', function() {
      this.$scope.contact = {
        photo: 'data:image/png,base64;abcd='
      };
      this.$scope.$digest();

      expect(element.find('img').attr('src')).to.equal('data:image/png,base64;abcd=');
    });

  });

  describe('The editable contactPhoto directive', function() {

    var element;

    beforeEach(function() {
      element = this.$compile('<contact-photo editable="true" contact="contact"></contact-photo>')(this.$scope);
    });

    it('should display the hint', function() {
      this.$scope.$digest();

      expect(element.find('i').css('display')).to.not.equal('none');
    });

  });


  describe('The relaxedDate directive', function() {

    var $compile, $rootScope, element, $scope, DATE_FORMAT;

    beforeEach(inject(function(_$compile_, _$rootScope_, _DATE_FORMAT_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      DATE_FORMAT = _DATE_FORMAT_;

      $scope = $rootScope.$new();
    }));

    beforeEach(function() {
      element = $compile('<form name="form"><input type="text" name="date" relaxed-date ng-model="date" /></form>')($scope);
    });

    it('should define the placeholder on the element', function() {
      expect(element.find('input').attr('placeholder')).to.equal(DATE_FORMAT);
    });

    it('should parse the value as a Date object', function() {
      $scope.form.date.$setViewValue('01/31/1970');
      $scope.$digest();

      expect($scope.date).to.equalDate(new Date(1970, 0, 31));
    });

    it('should allow any string value', function() {
      $scope.form.date.$setViewValue('I am not a date');
      $scope.$digest();

      expect($scope.date).to.equal('I am not a date');
    });

    it('should display a formatted date if the model contains a valid Date', function() {
      $scope.date = new Date(2015, 0, 15);
      $scope.$digest();

      expect($scope.form.date.$viewValue).to.equal('01/15/2015');
    });

    it('should display any string value if model is not a Date', function() {
      $scope.date = 'I am still not a date';
      $scope.$digest();

      expect($scope.form.date.$viewValue).to.equal('I am still not a date');
    });
  });


  describe('The keepScrollPosition directive', function() {
    var $location;
    var $timeout;
    var $scope;

    function doInject() {
      inject(function(_$location_, _$timeout_, $compile, $rootScope) {
        $location = _$location_;
        $timeout = _$timeout_;
        $scope = $rootScope.$new();
        $compile('<div keep-scroll-position></div>')($scope);
      });
    }

    it('should save scroll position on $locationChangeStart event', function(done) {
      var path = '/a/path/here';
      var position = 100;

      module('linagora.esn.contact', function($provide) {
        $provide.decorator('$location', function($delegate) {
          $delegate.path = function() {
            return path;
          };
          return $delegate;
        });

        $provide.decorator('$document', function($delegate) {
          $delegate.scrollTop = function() {
            return position;
          };
          return $delegate;
        });

        $provide.decorator('$cacheFactory', function($delegate) {
          $delegate.get = function() {
            return {
              put: function(key, value) {
                expect(key).to.equal(path, position);
                done();
              }
            };
          };
          return $delegate;
        });
      });

      doInject();
      $scope.$digest();
      $scope.$emit('$locationChangeStart');
    });

    it('should scroll to saved position on viewRenderFinished event', function(done) {
      var path = '/a/path/here';
      var position = 100;

      module('linagora.esn.contact', function($provide) {
        $provide.decorator('$location', function($delegate) {
          $delegate.path = function() {
            return path;
          };
          return $delegate;
        });

        $provide.decorator('$document', function($delegate) {
          $delegate.scrollTop = function(top) {
            expect(top).to.equal(position);
            done();
          };
          return $delegate;
        });

        $provide.decorator('$cacheFactory', function($delegate) {
          $delegate.get = function() {
            return {
              get: function(key) {
                expect(key).to.equal(path);
                return position;
              }
            };
          };
          return $delegate;
        });
      });

      doInject();
      $scope.$digest();
      $scope.$emit('viewRenderFinished');
      $timeout.flush();
    });

  });

  describe('The contactListToggle directive', function() {

    var $compile, $rootScope, element, $scope, CONTACT_LIST_DISPLAY;

    beforeEach(inject(function(_$compile_, _$rootScope_, _CONTACT_LIST_DISPLAY_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      CONTACT_LIST_DISPLAY = _CONTACT_LIST_DISPLAY_;
      $scope = $rootScope.$new();
      $scope.displayAs = CONTACT_LIST_DISPLAY.list;
    }));

    beforeEach(function() {
      element = $compile('<contact-list-toggle></contact-list-toggle>')($scope);
      $scope.$digest();
    });

    it('should have list button activated at start', function() {
      expect(element.find('.btn-contacts-list-toggle')).to.be.disabled;
      expect(element.find('.btn-contacts-cards-toggle')).to.be.enabled;
    });

    it('should switch buttons when clicking on cards one', function() {
      element.find('.btn-contacts-cards-toggle').click();
      expect(element.find('.btn-contacts-list-toggle')).to.be.enabled;
      expect(element.find('.btn-contacts-cards-toggle')).to.be.disabled;
    });

    it('should switch buttons back to intial state when clicking on cards then list', function() {
      element.find('.btn-contacts-cards-toggle').click();
      element.find('.btn-contacts-list-toggle').click();
      expect(element.find('.btn-contacts-list-toggle')).to.be.disabled;
      expect(element.find('.btn-contacts-cards-toggle')).to.be.enabled;
    });
  });
});
