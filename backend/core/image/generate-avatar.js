const Canvas = require('canvas');
const DEFAULT_AVATAR_SIZE = 256;
const FONT_RATIO = 88;

// color spec from:
// https://www.google.com/design/spec/style/color.html#color-color-palette
const COLORS = [
  { bgColor: '#F44336', fgColor: 'white' }, // Red
  { bgColor: '#E91E63', fgColor: 'white' }, // Pink
  { bgColor: '#9C27B0', fgColor: 'white' }, // Purple
  { bgColor: '#673AB7', fgColor: 'white' }, // Deep Purple
  { bgColor: '#3F51B5', fgColor: 'white' }, // Indigo
  { bgColor: '#2196F3', fgColor: 'white' }, // Blue
  { bgColor: '#03A9F4', fgColor: 'black' }, // Light Blue
  { bgColor: '#00BCD4', fgColor: 'black' }, // Cyan
  { bgColor: '#009688', fgColor: 'white' }, // Teal
  { bgColor: '#4CAF50', fgColor: 'black' }, // Green
  { bgColor: '#8BC34A', fgColor: 'black' }, // Light Green
  { bgColor: '#CDDC39', fgColor: 'black' }, // Lime
  { bgColor: '#FFEB3B', fgColor: 'black' }, // Yellow
  { bgColor: '#FF9800', fgColor: 'black' }, // Orange
  { bgColor: '#FF5722', fgColor: 'white' }, // Deep Orange
  { bgColor: '#795548', fgColor: 'white' }, // Brown
  { bgColor: '#9E9E9E', fgColor: 'black' }, // Grey
  { bgColor: '#607D8B', fgColor: 'white' } // Blue Grey
];
const COLORS_SIZE = COLORS.length;
const DEFAULT_COLOR = COLORS[0];

module.exports = {
  // export as a private method for testing purpose (still need more discussion)
  _calculateFitFontSize: calculateFitFontSize,
  generateFromText,
  getColorsFromUuid
};

/**
 * Calculate approximate font size to draw text to fit the canvas.
 * Note that the canvasContex must be already added the font to be used by
 * addFont method.
 *
 * Inspired by:
 * http://stackoverflow.com/questions/20551534/size-to-fit-font-on-a-canvas
 *
 * More about TextMetrics on:
 * https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics
 * @param  {Context} canvasContext Context instance return by getContext('2d')
 *                                 method of Canvas
 * @param  {Number} canvasSize    size of Canvas
 * @param  {String} text          text to be drawn
 * @return {Number}               calculated font size
 */
function calculateFitFontSize(canvasContext, canvasSize, text) {
  let fontSize = 0;
  let textMetric, textWidth, textHeight;

  do {
    fontSize++;
    canvasContext.font = fontName(fontSize);
    textMetric = canvasContext.measureText(text);
    textWidth = textMetric.width;
    textHeight = textMetric.emHeightAscent + textMetric.emHeightDescent;
  } while (textWidth < canvasSize && textHeight < canvasSize);

  return fontSize;
}

/**
 * Generate avatar from text
 * @param  {Object}  options input object contain:
 *                       - text (String): required, text to be drawn,
 *                       1 -> 2 characters
 *                       - size (Number)
 *                       - bgColor (String)
 *                       - fgColor (String)
 *                       - font (String)
 *                       - toBase64 (String):  set to true to return Base64
 *                       image data of avatar
 * @return {Buffer} Buffer instance of image or null if data is not well-formed
 * @return {String} Base64 image data of avatar if options.toBase64 is set to true
 */
function generateFromText(options) {
  if (!options || !options.text) {
    return null;
  }

  const text = String(options.text).substring(0, 2).toUpperCase();
  const avatarSize = parseInt(options.size, 10) || DEFAULT_AVATAR_SIZE;
  const bgColor = options.bgColor || DEFAULT_COLOR.bgColor;
  const fgColor = options.fgColor || DEFAULT_COLOR.fgColor;
  const canvas = new Canvas(avatarSize, avatarSize);
  const ctx = canvas.getContext('2d');
  let fontSize = 1;

  // draw background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, avatarSize, avatarSize);

  if (text.length === 1) {
    // use precalculated font ratio to improve perfomance
    fontSize = avatarSize * FONT_RATIO / 100;
  } else if (text.length > 1) {
    fontSize = calculateFitFontSize(ctx, avatarSize, text);
  }

  ctx.font = fontName(fontSize);

  // draw text in the center
  ctx.fillStyle = fgColor;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  ctx.fillText(text, avatarSize / 2, avatarSize / 2);

  if (options.toBase64 === true) {
    return canvas.toDataURL();
  }

  return canvas.toBuffer();
}

/**
 * Get colors based on 3 last characters of uuid
 * @param  {String} uuid
 * @return {Object}
 */
function getColorsFromUuid(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return DEFAULT_COLOR;
  }

  const length = uuid.length;

  if (length < 3) {
    return DEFAULT_COLOR;
  }

  const sum = uuid.charCodeAt(length - 1) +
            uuid.charCodeAt(length - 2) +
            uuid.charCodeAt(length - 3);

  return COLORS[sum % COLORS_SIZE];
}

function fontName(size) {
  return size + 'px Arial';
}

// Work around to node-canvas issue in version 1.2.3:
// https://github.com/Automattic/node-canvas/issues/487
module.exports.Canvas = Canvas;
