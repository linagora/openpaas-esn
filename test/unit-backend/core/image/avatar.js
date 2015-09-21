'use strict';

var expect = require('chai').expect;

describe('The image avatar module', function() {

  var avatarModule;

  beforeEach(function() {
    avatarModule = this.helpers.requireBackend('core/image/generate-avatar');
  });

  describe('The _calculateFitFontSize private fn', function() {

    var canvasContext, canvasSize;

    beforeEach(function() {
      canvasSize = 100;

      var canvas = new avatarModule.Canvas(canvasSize, canvasSize);
      canvasContext = canvas.getContext('2d');
    });

    it('should return an approximate font size for canvas', function() {
      var fontSize = avatarModule
        ._calculateFitFontSize(canvasContext, canvasSize, 'A');
      expect(fontSize).to.be.a('number');
      expect(fontSize).to.least(1); // >= 1 because there's at least one do-while loop run
    });

    it('should return larger font size when size of canvas increase', function() {
      var text = 'A';

      var smallerSize = avatarModule
        ._calculateFitFontSize(canvasContext, 100, text);

      var largerSize = avatarModule
        ._calculateFitFontSize(canvasContext, 200, text);

      expect(smallerSize).to.most(largerSize);

    });

    it('should return smaller font size when more letters added', function() {
      var largerSize = avatarModule
        ._calculateFitFontSize(canvasContext, canvasSize, 'A');

      var smallerSize = avatarModule
        ._calculateFitFontSize(canvasContext, canvasSize, 'AA');

      var smallestSize = avatarModule
        ._calculateFitFontSize(canvasContext, canvasSize, 'AAA');

      expect(smallerSize).to.most(largerSize);
      expect(smallestSize).to.most(smallerSize);

    });

    it('should still return font size when canvasSize is equal 0', function() {
      var fontSize = avatarModule
        ._calculateFitFontSize(canvasContext, 0, 'A');
      expect(fontSize).is.an.instanceof.Number;
      expect(fontSize).to.least(1);
    });

    it('should still return font size when canvasSize is less than 0', function() {
      var fontSize = avatarModule
        ._calculateFitFontSize(canvasContext, -5, 'A');
      expect(fontSize).is.an.instanceof.Number;
      expect(fontSize).to.least(1);
    });

  });

  describe('The generateFromText fn', function() {

    it('should return null when options is undefined', function() {
      expect(avatarModule.generateFromText()).to.be.null;
    });

    it('should return null when options is null', function() {
      expect(avatarModule.generateFromText(null)).to.be.null;
    });

    it('should return null when options is an empty object', function() {
      expect(avatarModule.generateFromText({})).to.be.null;
    });

    it('should return null when options.text is empty string', function() {
      expect(avatarModule.generateFromText({ text: '' })).to.be.null;
    });

    it('should return Buffer instance when options.text is present', function() {
      expect(avatarModule.generateFromText({ text: 'A' }))
        .to.be.an.instanceof(Buffer);
    });

    it('should return Buffer instance when options.text is more than 1 letter', function() {
      expect(avatarModule.generateFromText({ text: 'ABC' }))
        .to.be.an.instanceof(Buffer);
    });

    it('should return Base64 image data when options.toBase64 is true', function() {
      expect(avatarModule.generateFromText({ text: 'A', toBase64: true }))
        .to.match(/^data:image\/png;base64/);
    });

  });

  describe('The getColorsFromUuid fn', function() {

    var DEFAULT_COLOR = { bgColor: '#F44336', fgColor: 'white' };

    it('should return an object of colors when there is uuid', function() {
      var colors = avatarModule
        .getColorsFromUuid('6dcd4d8c-5633-41a1-b2bb-3004895c6dfe');

      expect(colors).to.have.property('bgColor');
      expect(colors).to.have.property('fgColor');
    });

    it('should return default colors when there is no uuid', function() {
      var colors = avatarModule.getColorsFromUuid();
      expect(colors).to.eql(DEFAULT_COLOR);
    });

    it('should return default colors when uuid is not a string', function() {
      var colors = avatarModule.getColorsFromUuid(1);
      expect(colors).to.eql(DEFAULT_COLOR);

      colors = avatarModule.getColorsFromUuid({ field: 'value' });
      expect(colors).to.eql(DEFAULT_COLOR);
    });

    it('should return default colors when there uuid is an empty string', function() {
      var colors = avatarModule.getColorsFromUuid('');
      expect(colors).to.eql(DEFAULT_COLOR);
    });

    it('should return default colors when there uuid.length is less than 3', function() {
      var colors = avatarModule.getColorsFromUuid('ab');
      expect(colors).to.eql(DEFAULT_COLOR);
    });

  });

});
