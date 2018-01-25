'use strict';

const Primus = require('primus');
const {exec} = require('child_process');

const zmq = require('zeromq');
const inputRender = zmq.socket('pull').connect('tcp://127.0.0.1:9000');
const outputRender = zmq.socket('push').bindSync('tcp://127.0.0.1:9001');

const xml2js = require('xml2js');

const fs = require('fs');

const id = require('shortid').generate;

const fakeRenderData = [{
    "name": "tile_0_0"
    , "x": 16
    , "y": 16
    , "properties": {
        "hot": "true"
        , "model": "Red"
    }
    , "type": "tile"
}, {
    "name": "tile_1_0"
    , "x": 48
    , "y": 16
    , "properties": {
        "model": "Green"
    }
    , "type": "tile"
}, {
    "name": "tile_2_0"
    , "x": 80
    , "y": 16
    , "properties": {
        "model": "Blue"
    }
    , "type": "tile"
}, {
    "name": "tile_3_0"
    , "x": 112
    , "y": 16
    , "properties": {
        "model": "Cyan"
    }
    , "type": "tile"
}, {
    "name": "tile_99_0"
    , "x": 3184
    , "y": 16
    , "properties": {
        "model": "Green"
    }
    , "type": "tile"
}, {
    "name": "tile_0_1"
    , "x": 16
    , "y": 48
    , "properties": {
        "hot": "true"
        , "model": "Red"
    }
    , "type": "tile"
}, {
    "name": "tile_2_1"
    , "x": 80
    , "y": 48
    , "properties": {
        "model": "Blue"
    }
    , "type": "tile"
}, {
    "name": "tile_2_2"
    , "x": 80
    , "y": 80
    , "properties": {
        "model": "Blue"
    }
    , "type": "tile"
}, {
    "name": "tile_1_3"
    , "x": 48
    , "y": 112
    , "properties": {
        "model": "Blue"
    }
    , "type": "tile"
}, {
    "name": "tile_2_3"
    , "x": 80
    , "y": 112
    , "properties": {
        "model": "Green"
    }
    , "type": "tile"
}, {
    "name": "cam"
    , "x": 16
    , "y": 144
    , "properties": {
        "target": "target1"
        , "z": "64"
    }
    , "type": "camera"
}, {
    "name": "freeFred"
    , "x": 127
    , "y": 31
    , "properties": {
        "hot": "true"
        , "model": "Red"
    }
    , "type": "stuff"
}, {
    "name": "target1"
    , "x": 80
    , "y": 48
    , "properties": {
        "marker": "bar"
        , "z": "-32"
    }
    , "type": "target"
}, {
    "name": "cam2"
    , "x": 176
    , "y": 272
    , "properties": {
        "target": "target1"
        , "z": "64"
    }
    , "type": "camera"
}];

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

            fs.writeFile('./temp/renderJob_' + uniqueName + '.json', JSON.stringify(fakeRenderData), function(err, file) {
                exec('blender --background --python append.py -- ' + uniqueName, (err, stdout, stderr) => {
                    fs.readFile('./temp/renderJob_' + uniqueName + '.json', function(err, file) {
                        console.log(file.toString());
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
