module.exports = dependencies => ({
  rights: {
    padmin: 'rw',
    admin: 'r',
    user: 'r'
  },
  configurations: {
    features: require('./features')(dependencies)
  }
});
