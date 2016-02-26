'use strict';

var elasticsearch = require('./index');

function indexData(options, callback) {
  var document = options.denormalize ? options.denormalize(options.data) : options.data;
  elasticsearch.addDocumentToIndex(document, {index: options.index, type: options.type, id: document.id + ''}, callback);
}
module.exports.indexData = indexData;

function removeFromIndex(options, callback) {
  elasticsearch.removeDocumentFromIndex({index: options.index, type: options.type, id: options.data.id + ''}, callback);
}
module.exports.removeFromIndex = removeFromIndex;
