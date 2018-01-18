const startPrimus = require('./primus.js');
const startSeneca = require('./seneca.js');
const startUploader = require('./uploader.js');
const startRenderer = require('./renderer.js');
const startClient = require('./client.js');

startPrimus();
startSeneca();
startUploader();
startRenderer();
startClient();
