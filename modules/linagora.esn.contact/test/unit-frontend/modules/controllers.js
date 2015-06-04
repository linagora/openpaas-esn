'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Contacts Angular module', function() {

  describe('the contactAvatarModalController', function() {
    beforeEach(function() {
      var self = this;

      this.selectionService = {};
      this.selectionService.clear = function() {};

      angular.mock.module('ngRoute');
      angular.mock.module('esn.core');
      angular.mock.module('linagora.esn.contact');
      angular.mock.module(function($provide) {
        $provide.value('selectionService', self.selectionService);
      });
    });

    beforeEach(angular.mock.inject(function($rootScope, _$controller_) {
      this.$rootScope = $rootScope;
      this.$controller = _$controller_;
    }));

    beforeEach(function() {
      this.scope = this.$rootScope.$new();
      this.$controller('contactAvatarModalController', {$scope: this.scope});
      this.scope.contact = {};
    });

    describe('the saveContactAvatar method', function() {
      it('should do nothing if no image is selected', function() {
        this.selectionService.getImage = function() {
          return false;
        };
        this.scope.saveContactAvatar();
        expect(this.scope.contact.photo).to.not.exist;
      });

      it('should add the image as base64 string to the contact and close the modal', function() {
        var blob = 'theblob';
        var imageAsBase64 = 'image';
        var modalHidden = false;

        window.FileReader = function() {
          return {
            readAsDataURL: function(data) {
              expect(data).to.equal(blob);
              this.result = imageAsBase64;
              this.onloadend();
            }
          };
        };

        this.selectionService.getImage = function() {
          return true;
        };
        this.selectionService.getBlob = function(mimetype, callback) {
          return callback(blob);
        };

        this.scope.modal = {
          hide: function() {
            modalHidden = true;
          }
        };

        this.scope.saveContactAvatar();
        expect(this.scope.loading).to.be.false;
        expect(modalHidden).to.be.true;
        expect(this.scope.contact.photo).to.equal(imageAsBase64);
      });
    });

  });

});
