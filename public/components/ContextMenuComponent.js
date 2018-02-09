const ContextMenuComponent = {
    data: {
        hoverIndex: -1
    },
    view: function(vnode) {
        const entries = vnode.attrs.entries || [];
        const onclick = vnode.attrs.onclick || function() {};
        const data = vnode.state.data;

        return m('div', {
            style: 'font-family: "Lucida Console", Monaco, monospace; border: 1px solid black; width: 200px;',
            onmouseout: function() { data.hoverIndex = -1 }
        }, entries.map(function(entry, index) {

            const isHovered = data.hoverIndex == index;

            return m('div', {
                style: 'cursor: pointer; ' + (isHovered ? 'background: red; ' : ''),
                onmouseover: function() {
                    data.hoverIndex = index;
                },
                onclick: function() {
                    onclick(entry, index);
                }
            }, [
                m('span', { style: 'display: inline-block; background-color: red; width: 20px; text-align: center; border: 1px solid black; border-radius: 8px; margin: 4px;' }, entry.icon),
                entry.name
            ]);
        }));
    }
};
