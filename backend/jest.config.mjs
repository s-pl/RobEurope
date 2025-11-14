export default {
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!supertest)',
    'index.js',
    'models/',
    'controller/',
    'routes/',
    'middleware/',
    'utils/',
    'scripts/',
    'migrations/',
    'seeders/',
  ],
};