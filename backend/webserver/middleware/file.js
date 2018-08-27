const { getMeta } = require('../../core/filestore');

module.exports = {
  isOwner,
  loadMeta,
  validateMIMEType
};

function loadMeta(req, res, next) {
  getMeta(req.params.id, (err, meta) => {
    if (err) {
      return res.status(500).json({ error: { code: 500, message: 'Error while getting file', details: err.message } });
    }

    if (!meta) {
      return res.status(404).json({ error: { code: 404, message: 'Not found', details: 'File not found' } });
    }

    if (!meta.metadata) {
      return res.status(500).json({ error: { code: 500, message: 'Server Error', details: 'Can not find file metadata' } });
    }

    req.fileMeta = meta;

    next();
  });
}

function isOwner(req, res, next) {
  if (req.fileMeta.metadata.creator && req.fileMeta.metadata.creator.objectType === 'user' && !req.fileMeta.metadata.creator.id.equals(req.user._id)) {
    return res.status(403).json({ error: { code: 403, message: 'Forbidden', details: 'Current user is not a file owner' } });
  }

  next();
}

function validateMIMEType(acceptedTypes) {
  return (req, res, next) => {
    if (acceptedTypes && acceptedTypes.indexOf(req.query.mimetype.toLowerCase()) < 0) {
      return res.status(415).json({
        error: {
          code: 415,
          message: 'Unsupported Media Type',
          details: `Mimetype ${req.query.mimetype} is not accepted: should be one in ${acceptedTypes.join(', ')}`
        }
      });
    }

    next();
  };
}
