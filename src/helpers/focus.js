import aspect from 'dojo/aspect';

function isDescendant(parentNode, child) {
    let node = child.parentNode;
    while (null !== node) {
        if (node === parentNode) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
}

export function fixFocusHandler(domNode) {
    // mxui.wm.focus.onfocus screws with our widget. So we disable it if this is called on an element in our own widget
    return aspect.around(mxui.wm.focus, 'onfocus', function (onfocusHandler) {
        const _this = mxui.wm.focus;
        return function () {
            const args = arguments;
            const node = args[ 0 ];

            if (node && !isDescendant(domNode, node)) {
                onfocusHandler.apply(_this, args);
            }
        };
    });
}
