'use strict';

const Primus = require('primus');

const zmq = require('zeromq');
const inputRender = zmq.socket('pull').connect('tcp://127.0.0.1:9000');
const outputRender = zmq.socket('push').bindSync('tcp://127.0.0.1:9001');

module.exports = function start() {

    inputRender.on('message', function(msg){
        const data = JSON.parse(msg.toString());

        if (data.extension == 'json') {
            data.content = (new Buffer(JSON.stringify(data.content))).toString('base64');
        }
        else if (data.extension == 'txt') {
            data.content = (new Buffer(data.content)).toString('base64');
        }
        else {
            data.content = '';
        }

        outputRender.send(JSON.stringify(data));
    });
}
