module.exports = {
  parseAddressbookPath,
  parseContactPath,
  parsePrincipal
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

function parsePrincipal(principal) {
  // a principal is in form of principals/<type>/<ID>
  const match = String(principal).match(/^principals\/(.*?)\/(.*?)$/);

  return match && {
    type: match[1],
    id: match[2]
  };
}
