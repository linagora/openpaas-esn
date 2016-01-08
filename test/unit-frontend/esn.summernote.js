'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.summernote Angular module', function() {
  var $rootScope, summernote;

  beforeEach(function() {
    angular.mock.module('esn.summernote-wrapper', function($provide) {
      $provide.value('summernote', summernote = { plugins: {} });
    });
  });

  describe('The summernotePlugins factory', function() {

    var summernotePlugins;

    describe('The add function', function() {

      beforeEach(function() {
        inject(function(_summernotePlugins_) {
          summernotePlugins = _summernotePlugins_;
        });
      });

      it('should register a new plugin to summernote.plugins', function() {
        summernotePlugins.add('myPlugin', { a: 'b' });

        expect(summernote.plugins.myPlugin).to.deep.equal({ a: 'b' });
      });

      it('should overwrite an existing plugin in summernote.plugins', function() {
        summernotePlugins.add('myPlugin', { a: 'b' });
        summernotePlugins.add('myPlugin', { c: 'd' });

        expect(summernote.plugins.myPlugin).to.deep.equal({ c: 'd' });
      });

    });

  });

  describe('the fullscreen plugin', function() {

    var plugin, btn, icon, editor;

    beforeEach(function() {
      angular.mock.module('esn.summernote-wrapper');
      angular.mock.inject(function(_$rootScope_, FullscreenPlugin) {
        plugin = FullscreenPlugin;
        $rootScope = _$rootScope_;
      });

      btn = $('<button><i class="fa fa-expand" /></button>');
      icon = btn.find('i.fa');
      editor = $('<div />');
    });

    it('should register a new "esnFullscreen" button', function(done) {
      plugin({
        memo: function(name, button) {
          expect(name).to.equal('button.esnFullscreen');
          expect(button).to.be.a('function');

          done();
        }
      });
    });

    it('should create a button with an icon', function(done) {
      summernote.ui = {
        button: function(button) {
          expect(button.contents).to.equal('fa fa-expand');

          done();
        },
        icon: function(icon) { return icon; }
      };

      plugin({
        memo: function(name, button) { button(); }
      });
    });

    it('should send the appropriate command to summernote when button is clicked', function(done) {
      summernote.ui = {
        button: function(button) { button.click.bind(btn)(); },
        icon: function() {}
      };

      plugin({
        memo: function(name, button) { button(); },
        invoke: function(command) {
          expect(command).to.equal('fullscreen.toggle');

          done();
        }
      });
    });

    it('should toggle classes on the icon when button is clicked', function(done) {
      summernote.ui = {
        button: function(button) {
          button.click.bind(btn)();

          expect(icon.hasClass('fa-compress')).to.equal(true);
          expect(icon.hasClass('fa-expand')).to.equal(false);

          done();
        },
        icon: function() {}
      };

      plugin({
        memo: function(name, button) { button(); },
        invoke: function() {},
        layoutInfo: { editor: editor }
      });
    });

    it('should broadcast header:show when going out of fullscreen', function(done) {
      $rootScope.$on('header:show', function() { done(); });

      summernote.ui = {
        button: function(button) { button.click.bind(btn)(); },
        icon: function() {}
      };

      plugin({
        memo: function(name, button) { button(); },
        invoke: function() {},
        layoutInfo: { editor: editor }
      });
    });

    it('should broadcast header:hide when going in fullscreen mode', function(done) {
      editor.addClass('fullscreen');
      $rootScope.$on('header:hide', function() { done(); });

      summernote.ui = {
        button: function(button) { button.click.bind(btn)(); },
        icon: function() {}
      };

      plugin({
        memo: function(name, button) { button(); },
        invoke: function() {},
        layoutInfo: { editor: editor }
      });
    });

  });

});
