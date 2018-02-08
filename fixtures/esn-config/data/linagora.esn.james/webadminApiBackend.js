module.exports = function() {
  const host = process.env.JAMES_WEBADMIN_HOST || 'localhost';
  const port = process.env.JAMES_WEBADMIN_PORT || '8000';

  return `http://${host}:${port}`;
};
