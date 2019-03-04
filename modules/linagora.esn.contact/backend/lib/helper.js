module.exports = {
  parseAddressbookPath,
  parseContactPath
};

function parseAddressbookPath(path) {
  // a path is in form of addressbooks/<Book Home>/<Book Name>.json
  const match = String(path).match(/addressbooks\/(.*?)\/(.*?)\.json/);

  if (match) {
    return {
      bookHome: match[1],
      bookName: match[2]
    };
  }

  return {};
}

function parseContactPath(path) {
  // a path is in form of addressbooks/<Book Home>/<Book Name>/<Card Id>.vcf
  const match = String(path).match(/addressbooks\/(.*?)\/(.*?)\/(.*?)\.vcf/);

  if (match) {
    return {
      bookHome: match[1],
      bookName: match[2],
      contactId: match[3]
    };
  }

  return {};
}
