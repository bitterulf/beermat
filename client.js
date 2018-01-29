'use strict';

const Primus = require('primus');

module.exports = function start() {
    const Socket = Primus.createSocket()
    const client = new Socket('http://localhost:6666');

    client.write({identity: 'user:bob'});

    client.on('data', function(data) {
        // console.log('client got', data);
    })

}
