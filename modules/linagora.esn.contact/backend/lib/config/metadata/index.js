module.exports = dependencies => ({
  rights: {
    padmin: 'rw',
    admin: 'rw',
    user: 'r'
  },
  configurations: {
    features: require('./features')(dependencies)
  }
});
