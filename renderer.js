'use strict';

const Primus = require('primus');
const {exec} = require('child_process');

const zmq = require('zeromq');
const inputRender = zmq.socket('pull').connect('tcp://127.0.0.1:9000');
const outputRender = zmq.socket('push').bindSync('tcp://127.0.0.1:9001');

const xml2js = require('xml2js');

const fs = require('fs');

const id = require('shortid').generate;

const _ = require('highland');

module.exports = function start() {

    inputRender.on('message', function(msg){
        const data = JSON.parse(msg.toString());

        if (data.extension == 'json') {
            data.content = (new Buffer(JSON.stringify(data.content))).toString('base64');
            outputRender.send(JSON.stringify(data));
        }
        else if (data.extension == 'txt') {
            data.content = (new Buffer(data.content)).toString('base64');
            outputRender.send(JSON.stringify(data));
        }
        else if (data.extension == 'svg') {
            var parseString = xml2js.parseString;

            parseString(data.content, function (err, result) {

                result.svg.g[0].path[0]['$'].style = result.svg.g[0].path[0]['$'].style.replace(';fill:#ff00ff;', ';fill:#ff0000;');

                result.svg.g[0].path.forEach(function(path) {
                    let color = '#ff00ff';
                    if (path['$'].id == 'first') {
                        color = '#ff0000';
                    }
                    path['$'].style = path['$'].style.replace(';fill:#81feff;', ';fill:' + color + ';');
                });

                const builder = new xml2js.Builder();
                const xml = builder.buildObject(result);

                data.content = (new Buffer(xml)).toString('base64');
                outputRender.send(JSON.stringify(data));
            });
        }
        else if (data.extension == 'blend') { // temp/renderJob_' + jobId + '.json
            const uniqueName = id();

            fs.writeFile('./temp/renderJob_' + uniqueName + '.json', JSON.stringify(data.content), function(err, file) {
                exec('blender --background --python append.py -- ' + uniqueName, (err, stdout, stderr) => {
                    fs.readFile('./temp/renderJob_' + uniqueName + '_result.json', function(err, file) {
                        const images = JSON.parse(file.toString());

                        const readFile = _.wrapCallback(fs.readFile);

                        _(images)
                            .map(function(filename) {
                                return './temp/' + filename
                            })
                            .map(readFile)
                            .flatten()
                            .invoke('toString', ['base64'])
                            .toArray(function(imageContents) {
                                images.forEach(function(image, i){
                                    const nameParts = image.split('.')[0].split('_')
                                    const name = nameParts[nameParts.length - 1];

                                    outputRender.send(JSON.stringify({
                                        name: name,
                                        extension: 'png',
                                        content: imageContents[i]
                                    }));
                                })
                            });
                    });
                });
            });
        }
        else if (data.extension == 'blendo') {
            const uniqueName = id();
            exec('blender --background --render-output //temp/' + uniqueName + '_ --engine CYCLES --render-format PNG --use-extension 1 --render-frame 1 --python render.py', (err, stdout, stderr) => {
                fs.readFile('./temp/' + uniqueName + '_0001.png', function(err, file) {
                    data.content = file.toString('base64');
                    data.extension = 'png';
                    outputRender.send(JSON.stringify(data));
                });
            });
        }
    });
}
