module.exports = {
  parseAddressbookPath,
  parseContactPath,
  parseOwner
};

function parseAddressbookPath(path) {
  // a path is in form of addressbooks/<Book Id>/<Book Name>
  const match = String(path).match(/addressbooks\/(.*?)\/(.*?)$/);

  if (match) {
    return {
      bookId: match[1],
      bookName: match[2]
    };
  }

  return {};
}

function parseContactPath(path) {
  // a path is in form of addressbooks/<Book Id>/<Book Name>/<Contact ID>.vcf
  const match = String(path).match(/addressbooks\/(.*?)\/(.*?)\/(.*?)\.vcf/);

  if (match) {
    return {
      bookId: match[1],
      bookName: match[2],
      contactId: match[3]
    };
  }

  return {};
}

function parseOwner(principalUri) {
  // a principalUri is in form of principals/users/<user ID>
  const match = String(principalUri).match(/^principals\/users\/(.*?)$/);

  return match ? match[1] : null;
}
