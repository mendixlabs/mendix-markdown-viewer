import {
    defineWidget,
    getData,
    log,
    runCallback,
} from 'widget-base-helpers';

import Markdown from 'markdown-it';
import prism from '@/libs/markdown-it-prism';
import MarkdownItContainer from 'markdown-it-container';

import dojoArray from 'dojo/_base/array';

const oldSnippetCode = /{{% snippet file="([A-Za-z0-9.+-/]+)" %}}/g;
const newSnippetCode = /@snippet\[([A-Za-z0-9./+-]+)\]/g;

export default defineWidget('Libraries', null, {

    _snippets: null,

    snippetEntity: null,
    snippetKeyAttr: null,
    snippetContentAttr: null,

    constructor() {
        // These are used in the widget, so they are added to the widget
        this.log = log.bind(this);
        this.runCallback = runCallback.bind(this);
    },

    _snippetsUsed() {
        return "" !== this.snippetEntity && "" !== this.snippetKeyAttr && "" !== this.snippetContentAttr;
    },

    _getSnippets(cb) {
        logger.debug('Markdown.widgets.Libraries._getSnippets');
        if (this._obj && this._snippetsUsed()) {
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
                    this._snippets = snippets;
                    runCallback.call(this, cb, '_getSnippets snippets saved');
                }, e => {
                    logger.warn(this.id + '_getSnippets error', e);
                    runCallback.call(this, cb, '_getSnippets no snippets');
                });
        } else {
            runCallback.call(this, cb, '_getSnippets no snippets');
        }
    },

    _replaceSnippets(text) {
        if (this._obj && this._snippetsUsed() && this._snippets) {
            const matched = text.match(newSnippetCode);
            if (null !== matched && 0 < matched.length) {

                return text.replace(newSnippetCode, (match, p1) => {
                    const newContent = this._snippets[ p1 ];
                    if ('undefined' !== typeof newContent) {
                        return newContent;
                    }
                    return `!!! unknown snippet ***${p1}*** !!!`;
                });
            }
            return text;
        }
        return text;
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

    _getHTML(text) {
        const replacedText = this._replaceSnippets(this._preReplace(text));
        return this._md.render(replacedText);
    },
});
