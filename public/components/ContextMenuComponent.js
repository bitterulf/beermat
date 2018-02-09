const ContextMenuComponent = {
    data: {
        hoverIndex: -1
    },
    oninit: function(vnode) {
        vnode.attrs.entries = vnode.attrs.entries || [];
        vnode.attrs.onclick = vnode.attrs.onclick || function() {};

        vnode.attrs.entries.forEach(function(entry, index) {
            if (entry.hotkey) {
                Mousetrap.bind(['shift+' + entry.hotkey], function(e) {
                    vnode.attrs.onclick(entry, index)
                    return false;
                });
            }
        });

    },
    view: function(vnode) {

        const data = vnode.state.data;

        return m('div', {
            style: 'font-family: "Lucida Console", Monaco, monospace; border: 1px solid black; width: 200px;',
            onmouseout: function() { data.hoverIndex = -1 }
        }, vnode.attrs.entries.map(function(entry, index) {

            const isHovered = data.hoverIndex == index;

            return m('div', {
                style: 'cursor: pointer; ' + (isHovered ? 'background: red; ' : ''),
                onmouseover: function() {
                    data.hoverIndex = index;
                },
                onclick: function() {
                    vnode.attrs.onclick(entry, index);
                }
            }, [
                m('span', { style: 'display: inline-block; background-color: red; width: 20px; text-align: center; border: 1px solid black; border-radius: 8px; margin: 4px;' }, entry.icon),
                entry.name
            ]);
        }));
    }
};
