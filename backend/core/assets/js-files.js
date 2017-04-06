const ngAnnotate = require('ng-annotate/ng-annotate-main');
const q = require('q');
const readFile = require('fs').readFile;

function prepareJsFiles(jsType, app, namespace) {
  const jsTypeFullPath = `${jsType}FullPath`;
  const allFiles = app.type(jsTypeFullPath).allNames([namespace]);

  if (!allFiles.length) {
    return q.resolve('');
  }

  return _readAllFiles(allFiles)
    .then(contents => q(_ngAnnotateAllFiles(contents)))
    .then(contents => contents.join(''));
}

function _ngAnnotateAllFiles(contentList) {
  return contentList.map(content => ngAnnotate(content, {add: true}).src);
}

function _readAllFiles(fileList) {
  return q.all(
    fileList.map(filename => q.nfcall(readFile, filename, 'utf-8'))
  );
}

module.exports = {
    prepareJsFiles
};
