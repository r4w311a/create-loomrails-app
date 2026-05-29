const { generateLoomRailsApp } = require('./dist/index.js');
generateLoomRailsApp({
  projectName: '../workspace/test_app3',
  includeMobile: true,
  database: 'postgresql',
  includeKamal: false
}).then(() => { console.log('Done!'); process.exit(0); }).catch(console.error);
