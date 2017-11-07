import Markdown from 'markdown-it';
import prism from 'markdown-it-prism';
import MarkdownItContainer from 'markdown-it-container';

const AlertContainer = md => {
    return {
        validate: params => {
            return params.trim().match(/^alert\s+(.*)$/);
        },
        render: (tokens, idx) => {
            const m = tokens[ idx ].info.trim().match(/^alert\s+(.*)$/);

            if (1 === tokens[ idx ].nesting) {
                // opening tag
                return `<div class="alert alert-${md.utils.escapeHtml(m[ 1 ])}">\n`;
            }

            // closing tag
            return '</div>\n';
        },
    };
};

import { defineWidget } from '@/helpers/widget';

export default defineWidget('Libraries', null, {

    createMD(opts) {
        this._md = new Markdown({
            html: 'undefined' !== typeof opts.html ? opts.html : false,
            xhtmlOut: 'undefined' !== typeof opts.xhtmlOut ? opts.xhtmlOut : true,
            linkify: 'undefined' !== typeof opts.linkify ? opts.linkify : true,
            typographer: 'undefined' !== typeof opts.typographer ? opts.typographer : true,
            breaks: 'undefined' !== typeof opts.breaks ? opts.breaks : true,
        });

        this._md.use(prism);
        this._md.use(MarkdownItContainer, 'alert', AlertContainer(this._md));
    },
});
