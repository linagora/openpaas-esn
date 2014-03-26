'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Members Angular module', function() {

  beforeEach(angular.mock.module('esn.members'));

  describe('memberDisplay directive', function() {

    //Load the karma built module containing the templates
    beforeEach(module('jadeTemplates'));

    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
    }]));

    beforeEach(function() {
      this.getExpectedHtmlForUser = function(firstName, lastName, email) {
        var templateAsHtmlString =
          '<div class="login-bg container-fluid">' +
            '<div class="row">' +
            '<div class="col-md-4">' +
            '<img src="/images/user.png">' +
            '</div>' +
            '<div class="col-md-8">' +
            '<h4 class="ng-binding">%FirstName %LastName</h4>' +
            '<span><a href="mailto:%Email" class="ng-binding">%Email</a></span>' +
            '</div>' +
            '</div>' +
            '</div>';
        templateAsHtmlString = templateAsHtmlString.replace(/%FirstName/g, firstName);
        templateAsHtmlString = templateAsHtmlString.replace(/%LastName/g, lastName);
        templateAsHtmlString = templateAsHtmlString.replace(/%Email/g, email);
        return templateAsHtmlString;
      };
    });

    it('should display a user from the scope using the template', function() {
      var html = '<member-display member="testuser"></member-display>';
      var element = this.$compile(html)(this.$rootScope);

      this.$rootScope.testuser = { _id: 123456789,
        firstname: 'John',
        lastname: 'Doe',
        emails: ['johndoe@linagora.com']
      };

      this.$rootScope.$digest();
      expect(element.html()).to.equal(this.getExpectedHtmlForUser(this.$rootScope.testuser.firstname,
        this.$rootScope.testuser.lastname, this.$rootScope.testuser.emails[0]));
    });

    it('should display the empty template if the provided user does not exist in the scope', function() {
      var html = '<member-display member="ghostuser"></member-display>';
      var element = this.$compile(html)(this.$rootScope);
      this.$rootScope.$digest();
      expect(element.html()).to.equal(this.getExpectedHtmlForUser('', '', ''));
    });
  });

});
