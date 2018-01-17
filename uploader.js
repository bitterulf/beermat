'use strict';

const Primus = require('primus');

const zmq = require('zeromq');
const inputUpload = zmq.socket('pull').connect('tcp://127.0.0.1:4000');

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
        const data = JSON.parse(msg.toString());
        console.log('upload request', data);

        try {
            fs.mkdirSync('./public/data/'+data.name);
        } catch (e) {

        }

        const filename = data.name + '_' + id() + '.json';
        const path = data.name + '/' + filename;

        fs.writeFile('./public/data/'+path, 'lol', function(err) {
            client.write({type: 'fileUpdate', name: data.name, path: path});
        });

    });
}
