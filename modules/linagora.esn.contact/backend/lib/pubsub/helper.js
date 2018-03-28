module.exports = {
  parseCardPath,
  parseOwner
};

function parseCardPath(path) {
  // a path is in form of addressbooks/<Book Home>/<Book Name>/<Card ID>.vcf
  const match = String(path).match(/addressbooks\/(.*?)\/(.*?)\/(.*?)\.vcf/);

  if (match) {
    return {
      bookHome: match[1],
      bookName: match[2],
      cardId: match[3]
    };
  }

  return {};
}

function parseOwner(principalUri) {
  // a principalUri is in form of principals/users/<user ID>
  const match = String(principalUri).match(/^principals\/users\/(.*?)$/);

  return match ? match[1] : null;
}
