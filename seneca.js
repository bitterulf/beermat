const zmq = require('zeromq');

const inputActions = zmq.socket('pull').connect('tcp://127.0.0.1:3000');
const outputUpload = zmq.socket('push').bindSync('tcp://127.0.0.1:4000');


var seneca = require('seneca')()

seneca.add('type:jump', (msg, reply) => {

    reply(null, {
        actions: [
            {type: 'upload', name: 'info', extension: 'txt', content: 'hello there!' },
            {type: 'upload', name: 'foo', extension: 'json', content: { foo: 'bar' } }
        ]
    });
})

module.exports = function start() {
    inputActions.on('message', function(msg){
        console.log('work: %s', msg.toString());

        const data = JSON.parse(msg.toString());

        seneca.act(data, function (err, result) {
            if (err) return console.error(err)

            result.actions.forEach(function(action) {
                if (action.type == 'upload') {
                    outputUpload.send(JSON.stringify({name: action.name, extension: action.extension, content: action.content }));
                }
            });
        })
    });
}
