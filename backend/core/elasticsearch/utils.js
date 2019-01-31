const { addDocumentToIndex, removeDocumentFromIndex } = require('./elasticsearch');

module.exports = {
  indexData,
  removeFromIndex
};

function denormalize(options, data) {
  return options.denormalize ? options.denormalize(data) : data;
}

function getId(options, data) {
  return options.getId ? options.getId(data) : data.id;
}

function indexData(options, callback) {
  var document = denormalize(options, options.data);
  var id = getId(options, options.data);

  addDocumentToIndex(document, {index: options.index, type: options.type, id: id + ''}, callback);
}

function removeFromIndex(options, callback) {
  var id = getId(options, options.data);

  removeDocumentFromIndex({index: options.index, type: options.type, id: id + ''}, callback);
}
