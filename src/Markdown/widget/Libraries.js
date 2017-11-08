import Markdown from 'markdown-it';
import prism from '@/libs/markdown-it-prism';
import MarkdownItContainer from 'markdown-it-container';

import dojoArray from 'dojo/_base/array';

import { defineWidget } from '@/helpers/widget';
import { getData } from '@/helpers/data';

const oldSnippetCode = /{{% snippet file="([A-Za-z0-9.+-/]+)" %}}/g;
const newSnippetCode = /@snippet\[([A-Za-z0-9./+-]+)\]/g;

export default defineWidget('Libraries', null, {

    snippetEntity: null,
    snippetKeyAttr: null,
    snippetContentAttr: null,

    _snippetsUsed() {
        return "" !== this.snippetEntity && "" !== this.snippetKeyAttr && "" !== this.snippetContentAttr;
    },

    _replaceSnippets(text, cb) {
        if (this._obj && this._snippetsUsed()) {
            const matched = text.match(newSnippetCode);
            if (null !== matched && 0 < matched.length) {
                getData({
                    xpath: `//${this.snippetEntity}`,
                })
                    .then(res => {
                        const snippets = {};
                        dojoArray.forEach(res, r => {
                            let key = r.get(this.snippetKeyAttr);
                            if (0 === key.indexOf('/')) {
                                key = key.slice(1);
                            }
                            snippets[ key ] = r.get(this.snippetContentAttr);
                        });

                        const newText = text.replace(newSnippetCode, (match, p1) => {
                            const newContent = snippets[ p1 ];
                            if ('undefined' !== typeof newContent) {
                                return newContent;
                            }
                            return `!!! unknown snippet ***${p1}*** !!!`;
                        });

                        cb(newText);
                    }, e => {
                        logger.warn(this.id + '_replaceSnippets error', e);
                        cb(text);
                    });
            } else {
                cb(text);
            }
        } else {
            cb(text);
        }
    },

    _elements: {
        AlertContainer(md) {
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
        },
    },

    createMD(opts) {
        this._md = new Markdown({
            html: 'undefined' !== typeof opts.html ? opts.html : false,
            xhtmlOut: 'undefined' !== typeof opts.xhtmlOut ? opts.xhtmlOut : true,
            linkify: 'undefined' !== typeof opts.linkify ? opts.linkify : true,
            typographer: 'undefined' !== typeof opts.typographer ? opts.typographer : true,
            breaks: 'undefined' !== typeof opts.breaks ? opts.breaks : true,
        });

        this._md.use(prism);
        this._md.use(MarkdownItContainer, 'alert', this._elements.AlertContainer(this._md));
    },

    _preReplace(text) {
        let renderText = text;

        renderText = renderText.trim();
        renderText = renderText.replace(/{{% alert type="(\w+)" %}}/g, '::: alert $1');
        renderText = renderText.replace(/{{% \/alert %}}/g, ':::');
        renderText = renderText.replace(oldSnippetCode, '@snippet[$1]');

        return renderText;
    },

    _getHTML(text, cb) {
        const replacedText = this._preReplace(text);

        this._replaceSnippets(replacedText, snippetsReplaced => {
            const html = this._md.render(snippetsReplaced);

            cb(html);
        });
    },
});
