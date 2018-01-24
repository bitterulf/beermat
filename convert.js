const fs = require('fs');

const mapData = require('./map.json');

const mapHeight = mapData.height;
const mapWidth = mapData.width;

const tileHeight = mapData.tileheight;
const tileWidth = mapData.tilewidth;

tileData = [];

console.log(mapData);

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

fs.writeFileSync('./placedTiles.json', JSON.stringify(placedTiles));
