'use strict';

var elasticsearch = require('./index');

function denormalize(options, data) {
  return options.denormalize ? options.denormalize(data) : data;
}

function getId(options, data) {
  return options.getId ? options.getId(data) : data.id;
}

function indexData(options, callback) {
  var document = denormalize(options, options.data);
  var id = getId(options, options.data);
  elasticsearch.addDocumentToIndex(document, {index: options.index, type: options.type, id: id + ''}, callback);
}
module.exports.indexData = indexData;

function removeFromIndex(options, callback) {
  var id = getId(options, options.data);
  elasticsearch.removeDocumentFromIndex({index: options.index, type: options.type, id: id + ''}, callback);
}
module.exports.removeFromIndex = removeFromIndex;
