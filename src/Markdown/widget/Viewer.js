import {
    defineWidget,
} from 'widget-base-helpers';

import Libraries from 'Libraries';

import domClass from 'dojo/dom-class';
import domAttr from 'dojo/dom-attr';
import html from 'dojo/html';

/* develblock:start */
import loadcss from 'loadcss';
loadcss(`/widgets/Markdown/widget/ui/Viewer.css`);
/* develblock:end */

import 'prismjs/themes/prism.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import 'prismjs/plugins/toolbar/prism-toolbar.css';

import './Viewer.scss';

export default defineWidget('Viewer', false, {

    // Set in the modeler
    attrText: '',
    optHtml: false,
    optxHtmlOut: true,
    optBreaks: true,
    optLinkify: true,
    optTypographer: true,

    // Internal properties
    _text: '',
    _md: null,

    _obj: null,

    postCreate() {
        this.log('postCreate', this._WIDGET_VERSION);
        domAttr.set(this.domNode, 'data-widget-version', this._WIDGET_VERSION);
        domClass.toggle(this.domNode, 'markdown-viewer', true);
        this._createConverter();

        // window._VIEWER = this; // TODO: Remove this!
    },

    update(obj, cb) {
        this.log('update');

        this._obj = obj;
        this._resetSubscriptions();

        if (obj && this.attrText) {
            if (this._snippetsUsed()) {
                this._getSnippets(() => {
                    this._updateRendering(cb);
                });
            } else {
                this._updateRendering(cb);
            }
        } else {
            this.runCallback(cb, 'update');
        }
    },

    _createConverter() {
        this.log('_createConverter');
        this.createMD({
            html: this.optHtml,
            xhtmlOut: this.optxHtmlOut,
            linkify: this.optLinkify,
            typographer: this.optTypographer,
            breaks: this.optBreaks,
        });
    },

    _updateRendering(cb) {
        this.log('_updateRendering');
        try {
            this._obj.fetch(this.attrText, val => {
                this._text = val;
                if (val && '' !== val) {
                    html.set(this.domNode, this._getHTML(this._text));
                    domClass.remove(this.domNode, 'hidden');
                } else {
                    domClass.add(this.domNode, 'hidden');
                }
                this.runCallback(cb, 'update');
            });
        } catch (e) {
            logger.warn(this.id, e);
            domClass.add(this.domNode, 'hidden');
            this.runCallback(cb, 'update');
        }
    },

    _resetSubscriptions() {
        this.unsubscribeAll();
        if (this._obj) {
            this.subscribe({
                guid: this._obj.getGuid(),
                callback: guid => {
                    mx.data.get({
                        guid,
                        callback: obj => {
                            this._obj = obj;
                            if (obj) {
                                this._updateRendering();
                            }
                        },
                    });
                },
            });

            this.subscribe({
                guid: this._obj.getGuid(),
                attr: this.attrText,
                callback: this._updateRendering,
            });
        }
    },

}, Libraries);
