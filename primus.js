const Primus = require('primus');

const zmq = require('zeromq');
const outputActions = zmq.socket('push').bindSync('tcp://127.0.0.1:3000');

module.exports = function start() {

    const state = {
        files: {

        }
    };

    const primus = Primus.createServer({
        port: 6666
    });

    primus.save(__dirname +'/public/primus.js');

    primus.on('connection', function (spark) {
        console.log('connected');

        spark.on('data', function(data) {
            if (data.identity) {
                if (data.identity == 'system:secret') {
                    spark.role = 'system';
                }
                else if (data.identity == 'user:bob') {
                    spark.role = 'user';
                    spark.write({type: 'stateUpdate', state: state});
                }
            }
            else {
                if (spark.role == 'system') {
                    if (data.type == 'fileUpdate') {
                        state.files[data.name] = data.path;

                        primus.forEach(function(spark) {
                            if (spark.role == 'user') {
                                spark.write({type: 'stateUpdate', state: state});
                            }
                        });
                    }
                }
                else if (spark.role == 'user') {
                    console.log('user does something', data);
                    outputActions.send(JSON.stringify(data));
                }
            }
        })
    });
}
