const Map = {
    view: function(vnode) {
        const mapData = vnode.attrs.mapData || [];

        const filteredMapData = mapData.filter(function(entry) {
            return entry.properties && entry.properties.model;
        });

        return m('div', { style: 'width: ' + 32 * 100 + 'px; height: '  + 32 * 100 + 'px; border: 1px solid black; position: relative;' }, filteredMapData.map(function(entry) {
            const cursorStyle = entry.type == 'stuff' ? 'cursor: pointer; ' : '';

            return m('img', {
                onclick: function() {
                    if (entry.type == 'stuff' && vnode.attrs.onClickStuff) {
                        vnode.attrs.onClickStuff(entry.name);
                    }
                },
                style: cursorStyle + 'width: 32px; height: 32px; border: 1px solid black; position: absolute; top:' + (entry.y - 16) + 'px; left: ' + (entry.x - 16) + 'px;',
                src: entry.properties.model + '.png'
            });
        }));
    }
};
