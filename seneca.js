const zmq = require('zeromq');

const inputActions = zmq.socket('pull').connect('tcp://127.0.0.1:3000');
const outputUpload = zmq.socket('push').bindSync('tcp://127.0.0.1:4000');


var seneca = require('seneca')()
var entities = require('seneca-entity')

seneca.use(entities)

const mapSVG = require('fs').readFileSync('./map.svg').toString();

const mapData = require('./map.json');

const mapConvert = function(mapData) {

    const mapHeight = mapData.height;
    const mapWidth = mapData.width;

    const tileHeight = mapData.tileheight;
    const tileWidth = mapData.tilewidth;

    tileData = [];

    mapData.tilesets.forEach(function(tileset) {
        Object.keys(tileset.tileproperties).forEach(function(propKey) {
            const prop = tileset.tileproperties[propKey];
            tileData[parseInt(tileset.firstgid) + parseInt(propKey)] = prop;
        });
    });

    const placedTiles = [];

    mapData.layers.forEach(function(layer) {
        if (layer.type == 'objectgroup') {
            layer.objects.forEach(function(object) {
                if (object.gid && tileData[object.gid]) {
                    placedTiles.push({
                        name: object.name,
                        x: object.x + tileWidth / 2,
                        y: object.y - tileHeight / 2,
                        properties: tileData[object.gid],
                        type: object.type || 'unknown'
                    })
                }
                else if (object.ellipse) {
                    placedTiles.push({
                        name: object.name,
                        x: object.x + object.width / 2,
                        y: object.y + object.height / 2,
                        properties: object.properties,
                        type: object.type || 'unknown'
                    })
                }
            });
        }
        else if (layer.type == 'tilelayer') {
            layer.data.forEach(function(tileId, index) {
                if (tileId != 0 && tileData[tileId]) {
                    const y = Math.floor(index / mapWidth);
                    const x = index - mapWidth * y;

                    placedTiles.push({
                        name: 'tile_' + x + '_' + y,
                        x: x * tileWidth + tileWidth / 2,
                        y: y * tileHeight + tileHeight / 2,
                        properties: tileData[tileId],
                        type: 'tile'
                    })
                }
            });
        }
    });

    return placedTiles;
}

seneca.add('role:syncResources', (msg, reply) => {
    seneca.make('collectedStuff').list$({}, function(err,list){
        const collectedStuff = list.map(function(entry) {
            return entry.name;
        });

        const convertedMapData = mapConvert(mapData)
            .filter(function(entry) {
                if (entry.type == 'stuff' && collectedStuff.indexOf(entry.name) > -1) {
                    return false;
                }

                return true;
            });

        reply(null, {
            actions: [
                {type: 'upload', name: 'info', extension: 'txt', content: 'hello there!' },
                {type: 'upload', name: 'foo', extension: 'json', content: { foo: 'bar' } },
                {type: 'upload', name: 'map', extension: 'svg', content: mapSVG },
                {type: 'upload', name: 'mapData', extension: 'json', content: convertedMapData },
                {type: 'upload', name: 'flop', extension: 'blend', content: convertedMapData }
            ]
        });
    })
})

seneca.add('type:jump', (msg, reply) => {
    seneca.act('role:syncResources', function (err, result) {
        reply(null, result);
    });
})

seneca.add('type:collect', (msg, reply) => {
    const collected = seneca.make('collectedStuff');
    collected.name = msg.target;

    // check if the thing is already collected
    collected.save$(function(err){
        seneca.act('role:syncResources', function (err, result) {
            reply(null, result);
        });
    })

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
