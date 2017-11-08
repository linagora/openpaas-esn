'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.form.helper Angular module', function() {

  beforeEach(function() {
    module('jadeTemplates');
    module('esn.form.helper');
  });

  describe('passwordMatch directive', function() {
    var html = '<form name="form"><input type="password" name="password1" password-match="settings.password2" ng-model="settings.password1">' +
        '<input type="password" name="password2" ng-model="settings.password2"></form>';
    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
    }]));

    it('should set unique to true when the password does not match', function() {
      var element = this.$compile(html)(this.$rootScope);
      var scope = element.scope();
      scope.settings = {
        password1: 'test',
        password2: 'test2'
      };
      this.$rootScope.$digest();
      expect(scope.form.$invalid).to.be.true;
      expect(scope.form.password1.$error.unique).to.be.true;
    });

    it('should set unique to false when the password does not match', function() {
      var element = this.$compile(html)(this.$rootScope);
      var scope = element.scope();
      scope.settings = {
        password1: 'test',
        password2: 'test'
      };
      this.$rootScope.$digest();
      expect(scope.form.$invalid).to.be.false;
      expect(scope.form.password1.$error.unique).to.be.undefined;
    });
  });

  describe('esnTrackFirstBlur directive', function() {
    var html = '<form name="form"><input type="text" name="test" ng-model="test" esn-track-first-blur></form>';
    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
    }]));

    it('should not set _blur in the model controller when started', function() {
      var element = this.$compile(html)(this.$rootScope);
      var scope = element.scope();
      this.$rootScope.$digest();
      expect(scope.form.test._blur).to.be.undefined;
    });

    it('should not set _blur in the model controller when element is focused', function() {
      var element = this.$compile(html)(this.$rootScope);
      var scope = element.scope();
      var input = element.find('input');
      this.$rootScope.$digest();
      input.focus();
      this.$rootScope.$digest();
      expect(scope.form.test._blur).to.be.undefined;
    });

    it('should set _blur in the model controller when element is blured', function() {
      var element = this.$compile(html)(this.$rootScope);
      var scope = element.scope();
      var input = element.find('input');
      this.$rootScope.$digest();
      input.focus();
      this.$rootScope.$digest();
      input.blur();
      this.$rootScope.$digest();
      expect(scope.form.test._blur).to.be.tr;
    });

  });

  describe('toggleSwitch directive', function() {

    var $compile, $scope;

    beforeEach(inject(function(_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $scope = _$rootScope_.$new();
    }));

    function initDirective(html) {
      html = html || '<toggle-switch></toggle-switch>';

      var element = $compile(html)($scope);

      $scope.$digest();

      return element;
    }

    it('should set ngModel to false if the attribute "ng-model" is undefined', function() {
      var element = initDirective();

      expect(element.isolateScope().ngModel).to.equal(false);
    });

    it('should change ngModel to true when toggle is called', function() {
      var element = initDirective();

      element.isolateScope().toggle();

      expect(element.isolateScope().ngModel).to.equal(true);
    });

    it('should have a default color', function() {
      var element = initDirective();

      expect(element.isolateScope().color).to.be.defined;
    });

    it('should set the color to the given one', function() {
      var color = 'red';
      var element = initDirective('<toggle-switch color="' + color + '"/>');

      expect(element.isolateScope().color).to.equal(color);
    });

    it('should change form.$dirty to true when toggle is called', function() {
      $scope.form = {
        $dirty: false,
        $setDirty: function() {
          $scope.form.$dirty = true;
        }
      };

      var element = initDirective('<toggle-switch form="form"/>');

      element.isolateScope().toggle();

      expect(element.isolateScope().form.$dirty).to.equal(true);
    });

    it('should show the provided label', function() {
      var element = initDirective('<toggle-switch label="mylabel"/>');

      expect(element.html()).to.contain('mylabel');
    });

  });

  describe('The esnSubmit directive', function() {
    var $compile, $rootScope;
    var $scope;

    beforeEach(inject(function(_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
    }));

    function initDirective(html) {
      var element = $compile(html)($scope);
      $scope.$digest();

      return element;
    }

    it('should trigger esnSubmit function on click', function() {
      $scope.myFunction = sinon.stub().returns($q.when());
      var element = initDirective('<button esn-submit="myFunction()"></button>');

      element.click();

      expect($scope.myFunction).to.have.been.calledOnce;
    });

    it('should disable button on click then enable again on promise resolves', function() {
      $scope.myFunction = function() {
        return $q.when();
      };
      var element = initDirective('<button esn-submit="myFunction()"></button>');

      element.click();
      expect(element.prop('disabled')).to.be.true;

      $scope.$digest();
      expect(element.prop('disabled')).to.be.false;
    });

    it('should disable button on click then enable again on promise rejects', function() {
      $scope.myFunction = function() {
        return $q.reject();
      };
      var element = initDirective('<button esn-submit="myFunction()"></button>');

      element.click();
      expect(element.prop('disabled')).to.be.true;

      $scope.$digest();
      expect(element.prop('disabled')).to.be.false;
    });

    it('should add an input type submit', function() {
      var element = initDirective('<form esn-submit="myFunction()"></form>');

      expect(element.find('input[type="submit"]')).to.exist;
    });

    it('should trigger esnSubmit function on form submit', function() {
      $scope.myFunction = sinon.stub().returns($q.when());
      var element = initDirective('<form esn-submit="myFunction()"><button type="submit"></button></form>');

      element.find('button').click();

      expect($scope.myFunction).to.have.been.calledOnce;
    });

    it('should disable submit button of the form on submit then enable again on promise resolves', function() {
      $scope.myFunction = function() {
        return $q.when();
      };
      var element = initDirective('<form esn-submit="myFunction()"><button type="submit"></button></form>');
      var button = element.find('button');

      button.click();
      expect(button.prop('disabled')).to.be.true;

      $scope.$digest();
      expect(button.prop('disabled')).to.be.false;
    });

    it('should disable submit button of the form on submit then enable again on promise rejects', function() {
      $scope.myFunction = function() {
        return $q.reject();
      };
      var element = initDirective('<form esn-submit="myFunction()"><button type="submit"></button></form>');
      var button = element.find('button');

      button.click();
      expect(button.prop('disabled')).to.be.true;

      $scope.$digest();
      expect(button.prop('disabled')).to.be.false;
    });

  });

  describe('The esnFormGroup directive', function() {
    var $rootScope, $compile;

    beforeEach(inject(function(_$rootScope_, _$compile_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
    }));

    function initTemplate(inputAttributes, fromGroupAttributes) {
      inputAttributes = angular.extend({ type: 'text' }, inputAttributes);
      fromGroupAttributes = angular.extend({}, fromGroupAttributes);

      var inputAttributesInString = Object.keys(inputAttributes)
        .map(function(key) {
          return key + '="' + inputAttributes[key] + '"';
        })
        .join(' ');
      var fromGroupAttributesInString = Object.keys(fromGroupAttributes)
        .map(function(key) {
          return key + '="' + fromGroupAttributes[key] + '"';
        })
        .join(' ');

      return '<form name="form">' +
                '<esn-form-group ' + fromGroupAttributesInString + ' >' +
                  '<input class="form-control" ng-model="model" name="name" ' + inputAttributesInString + ' />' +
                '</esn-form-group>' +
             '</form>';
    }

    function initDirective(scope, template) {
      scope = scope || $rootScope.$new();
      var element = $compile(template)(scope);

      scope.$digest();

      return element;
    }

    it('should show nothing when form is valid', function() {
      var template = initTemplate();
      var element = initDirective(null, template);

      var validatorMessageElement = angular.element(element[0].querySelectorAll('esn-form-validate-message'));

      expect(validatorMessageElement.text()).to.equal('');
    });

    it('should show default error message when form is filled with invalid value', function() {
      var template = initTemplate({ type: 'email' });
      var element = initDirective(null, template);
      var formControlEle = angular.element(element[0].querySelector('.form-control'));

      formControlEle.val('invalid-email').trigger('input');

      var validatorMessageElement = angular.element(element[0].querySelectorAll('esn-form-validate-message'));

      expect(validatorMessageElement.text()).to.equal('Invalid email');
    });

    it('should show custom error message when form is filled with invalid value', function() {
      var emailErrorMessage = 'This must be email format';
      var template = initTemplate({ type: 'email' }, { 'email-error-message': emailErrorMessage });
      var element = initDirective(null, template);
      var formControlEle = angular.element(element[0].querySelector('.form-control'));

      formControlEle.val('invalid-email').trigger('input');

      var validatorMessageElement = angular.element(element[0].querySelectorAll('esn-form-validate-message'));

      expect(validatorMessageElement.text()).to.equal(emailErrorMessage);
    });

    it('should show default message error when given invalid expression maxlength', function() {
      var template = initTemplate({ maxlength: 6 });
      var element = initDirective(null, template);
      var formControlEle = angular.element(element[0].querySelector('.form-control'));

      formControlEle.val('invalidmaxlength').trigger('input');

      var validatorMessageElement = angular.element(element[0].querySelectorAll('esn-form-validate-message'));

      expect(validatorMessageElement.text()).to.equal('Length must be less than or equal to 6');
    });

    it('should show default message error when given invalid expression minlength', function() {
      var template = initTemplate({ minlength: 5 });
      var element = initDirective(null, template);
      var formControlEle = angular.element(element[0].querySelector('.form-control'));

      formControlEle.val('abc').trigger('input');

      var validatorMessageElement = angular.element(element[0].querySelectorAll('esn-form-validate-message'));

      expect(validatorMessageElement.text()).to.equal('Length must be greater than or equal to 5');
    });

    it('should show default message error when given invalid expression max', function() {
      var template = initTemplate({ type: 'number', max: 30 });
      var element = initDirective(null, template);
      var formControlEle = angular.element(element[0].querySelector('.form-control'));

      formControlEle.val('31').trigger('input');

      var validatorMessageElement = angular.element(element[0].querySelectorAll('esn-form-validate-message'));

      expect(validatorMessageElement.text()).to.equal('This must be less than or equal to 30');
    });

    it('should show default message error when given invalid expression min', function() {
      var template = initTemplate({ type: 'number', min: 30 });
      var element = initDirective(null, template);
      var formControlEle = angular.element(element[0].querySelector('.form-control'));

      formControlEle.val('29').trigger('input');

      var validatorMessageElement = angular.element(element[0].querySelectorAll('esn-form-validate-message'));

      expect(validatorMessageElement.text()).to.equal('This must be greater than or equal to 30');
    });

    it('should add class has-required for esn-form-group when input is required', function() {
      var template = initTemplate({ required: 'required' });
      var element = initDirective(null, template);

      var adminFormGroupEle = angular.element(element[0].querySelector('esn-form-group'));

      expect(adminFormGroupEle.hasClass('has-required')).to.be.true;
    });

    it('should add class has-invalid for esn-form-group when input has blur event and invalid', function() {
      var template = initTemplate({ type: 'email' });
      var element = initDirective(null, template);
      var formControlEle = angular.element(element[0].querySelector('.form-control'));

      formControlEle.triggerHandler('focus');
      formControlEle.val('invalid-email').trigger('input');
      formControlEle.triggerHandler('blur');

      var adminFormGroupEle = angular.element(element[0].querySelector('esn-form-group'));

      expect(adminFormGroupEle.hasClass('has-invalid')).to.be.true;
    });

    it('should not add class has-invalid for esn-form-group when input has blur event and valid', function() {
      var template = initTemplate({ type: 'email' });
      var element = initDirective(null, template);
      var formControlEle = angular.element(element[0].querySelector('.form-control'));

      formControlEle.triggerHandler('focus');
      formControlEle.val('valid@linagora.com').trigger('input');
      formControlEle.triggerHandler('blur');

      var adminFormGroupEle = angular.element(element[0].querySelector('esn-form-group'));

      expect(adminFormGroupEle.hasClass('has-invalid')).to.be.false;
    });

    it('should add class has-focus for esn-form-group when input is focused', function() {
      var template = initTemplate();
      var element = initDirective(null, template);
      var formControlEle = angular.element(element[0].querySelector('.form-control'));

      formControlEle.triggerHandler('focus');

      var adminFormGroupEle = angular.element(element[0].querySelector('esn-form-group'));

      expect(adminFormGroupEle.hasClass('has-focus')).to.be.true;
    });

    it('should remove class has-focus for esn-form-group when input has blur event', function() {
      var template = initTemplate();
      var element = initDirective(null, template);
      var formControlEle = angular.element(element[0].querySelector('.form-control'));

      formControlEle.triggerHandler('blur');

      var adminFormGroupEle = angular.element(element[0].querySelector('esn-form-group'));

      expect(adminFormGroupEle.hasClass('has-focus')).to.be.false;
    });

    it('should support getting form controller from parent controller', function() {
      var template = '<form>' +
                        '<esn-form-group form="$ctrl.form">' +
                            '<input class="form-control"  ng-model="model" type="text" />' +
                        '</esn-form-group>' +
                     '</form>';
      var scope = $rootScope.$new();

      scope.$ctrl = { form: { controller: 'formController' } };

      expect(function() {
        return initDirective(scope, template);
      }).to.not.throw();
    });

    it('should throw exception when form controller is missing', function() {
      var template = '<form>' +
                        '<esn-form-group>' +
                          '<input class="form-control" ng-model="model" type="text" />' +
                        '</esn-form-group>' +
                     '</form>';

      function errorFunctionWrapper() {
        initDirective(null, template);
      }

      expect(errorFunctionWrapper).to.throw();
    });

    it('should support custom form\'s name', function() {
      var template = '<form name="customForm">' +
                        '<esn-form-group form="customForm">' +
                          '<input class="form-control" ng-model="model" type="text" />' +
                        '</esn-form-group>' +
                     '</form>';

      var element = initDirective(null, template);

      var validatorMessageElement = angular.element(element[0].querySelectorAll('esn-form-validate-message'));

      expect(validatorMessageElement.text()).to.equal('');
    });

    it('should support binding attribute for input', function() {
      var template = initTemplate({ type: 'number', min: '{{minValue}}' });
      var scope = $rootScope.$new();

      scope.minValue = 8;

      var element = initDirective(scope, template);
      var validatorMessageElement = angular.element(element[0].querySelector('esn-form-validate-message'));
      var formControlEle = angular.element(element[0].querySelector('.form-control'));

      formControlEle.val('5').trigger('input');
      expect(validatorMessageElement.text()).to.equal('This must be greater than or equal to 8');
    });

    it('should support binding attribute for input when attribute change value', function() {
      var template = initTemplate({ type: 'number', min: '{{minValue}}' });
      var scope = $rootScope.$new();

      scope.minValue = 8;

      var element = initDirective(scope, template);
      var validatorMessageElement = angular.element(element[0].querySelector('esn-form-validate-message'));
      var formControlEle = angular.element(element[0].querySelector('.form-control'));

      formControlEle.val('5').trigger('input');
      expect(validatorMessageElement.text()).to.equal('This must be greater than or equal to 8');

      element.scope().minValue = 6;
      element.scope().$digest();

      expect(validatorMessageElement.text()).to.equal('This must be greater than or equal to 6');
    });

    describe('when helper text is provided', function() {
      it('should always display the helper text and hide error message', function() {
        var helper = 'This is heplper text';
        var template = initTemplate(null, { helper: helper });
        var element = initDirective(null, template);

        expect(element.find('.help-block').html()).to.contain(helper);
        expect(element.find('esn-form-validate-message')).to.have.length(0);
      });
    });

    describe('when validator is provided', function() {
      var formGroupAttributes;

      it('should validate when validator is an asynchronous function', function() {
        formGroupAttributes = { 'async-validator': 'validator' };
        var template = initTemplate(null, formGroupAttributes);
        var scope = $rootScope.$new();
        var inputValue = 'value';

        scope.validator = sinon.stub().returns($q.when(true));

        var element = initDirective(scope, template);
        var formControlEle = element.find('.form-control');

        formControlEle.val(inputValue).trigger('input');

        expect(scope.validator).to.have.been.calledWith(inputValue);
      });

      it('should validate when validator is a synchronous function', function() {
        formGroupAttributes = { validator: 'validator' };
        var template = initTemplate(null, formGroupAttributes);
        var scope = $rootScope.$new();
        var inputValue = 'value';

        scope.validator = sinon.stub().returns(true);

        var element = initDirective(scope, template);
        var formControlEle = element.find('.form-control');

        formControlEle.val(inputValue).trigger('input');

        expect(scope.validator).to.have.been.calledWith(inputValue);
      });

      it('should show default synchronous error message when value is invalid', function() {
        formGroupAttributes = { validator: 'validator' };
        var template = initTemplate(null, formGroupAttributes);
        var scope = $rootScope.$new();
        var inputValue = 'value';

        scope.validator = sinon.stub().returns(false);

        var element = initDirective(scope, template);
        var formControlEle = element.find('.form-control');
        var validatorMessageElement = element.find('esn-form-validate-message');

        formControlEle.val(inputValue).trigger('input');
        formControlEle.trigger('blur');

        $rootScope.$digest();

        expect(scope.validator).to.have.been.calledWith(inputValue);
        expect(validatorMessageElement.text()).to.equal('Invalid value');
      });

      it('should show default asynchronous error message when value is invalid', function() {
        formGroupAttributes = { 'async-validator': 'validator' };
        var template = initTemplate(null, formGroupAttributes);
        var scope = $rootScope.$new();
        var inputValue = 'value';

        scope.validator = sinon.stub().returns($q.reject());

        var element = initDirective(scope, template);
        var formControlEle = element.find('.form-control');
        var validatorMessageElement = element.find('esn-form-validate-message');

        formControlEle.val(inputValue).trigger('input');
        formControlEle.trigger('blur');

        $rootScope.$digest();

        expect(scope.validator).to.have.been.calledWith(inputValue);
        expect(validatorMessageElement.text()).to.equal('Invalid value');
      });
    });
  });

  describe('The esnAutocompleteOff directive', function() {
    var $compile, $rootScope;
    var $scope;

    beforeEach(inject(function(_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
    }));

    function initDirective(html) {
      var element = $compile(html)($scope);

      $scope.$digest();

      return element;
    }

    it('should add a hidden input type text', function() {
      var element = initDirective('<form esn-autocomplete-off></form>');

      expect(element.find('input[type="text"]').length).to.equal(1);
    });

    it('should add a hidden input type password', function() {
      var element = initDirective('<form esn-autocomplete-off></form>');

      expect(element.find('input[type="password"]').length).to.equal(1);
    });
  });
});
