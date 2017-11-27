module.exports = {
  buildErrorMessage
};

function buildErrorMessage(errors) {
  return errors.map(error =>
    (error.dataPath ? `${error.dataPath}: ${error.message}` : `${error.message}`)
  ).join('; ');
}
