'use strict';

const Primus = require('primus');

const zmq = require('zeromq');
const inputUpload = zmq.socket('pull').connect('tcp://127.0.0.1:4000');
const outputRender = zmq.socket('push').bindSync('tcp://127.0.0.1:9000');
const inputRender = zmq.socket('pull').connect('tcp://127.0.0.1:9001');

const fs = require('fs');

const id = require('shortid').generate;

try {
    fs.mkdirSync('./public/data');
} catch (e) {

}

module.exports = function start() {
    const Socket = Primus.createSocket()
    const client = new Socket('http://localhost:6666');

    client.write({identity: 'system:secret'});

    inputUpload.on('message', function(msg){
        outputRender.send(msg.toString());
    });

    inputRender.on('message', function(msg){

        const data = JSON.parse(msg.toString());

        try {
            fs.mkdirSync('./public/data/'+data.name);
        } catch (e) {

        }

        const filename = data.name + '_' + id() + '.' + data.extension;
        const path = data.name + '/' + filename;

        fs.writeFile('./public/data/'+path, new Buffer(data.content, 'base64'), function(err) {
            client.write({type: 'fileUpdate', name: data.name, path: path});
        });

    });
}
