import { defineWidget } from '@/helpers/widget';
import { log, runCallback } from '@/helpers';

import domClass from 'dojo/dom-class';
import domAttr from 'dojo/dom-attr';
import html from 'dojo/html';

import Markdown from 'markdown-it';
import prism from 'markdown-it-prism';
import MarkdownItContainer from 'markdown-it-container';

import {
    AlertContainer,
} from './containers';

import './Viewer.scss';
import 'prismjs/themes/prism.css';

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
        log.call(this, 'postCreate', this._WIDGET_VERSION);
        domAttr.set(this.domNode, 'data-widget-version', this._WIDGET_VERSION);
        this._createConverter();
    },

    update(obj, cb) {
        log.call(this, 'update');

        this._obj = obj;
        this._resetSubscriptions();

        if (obj && this.attrText) {
            this._updateRendering(cb);
        } else {
            runCallback.call(this, cb, 'update');
        }
    },

    _createConverter() {
        log.call(this, '_createConverter');
        this._md = new Markdown({
            html: this.optHtml,
            xhtmlOut: this.optxHtmlOut,
            linkify: this.optLinkify,
            typographer: this.optTypographer,
            breaks: this.optBreaks,
        });

        this._md.use(prism);
        this._md.use(MarkdownItContainer, 'alert', AlertContainer(this._md));
    },

    _updateRendering(cb) {
        log.call(this, '_updateRendering');
        try {
            this._obj.fetch(this.attrText, val => {
                this._text = val;
                if (val && '' !== val) {
                    const alertHTML = this._md.render(this._text);

                    html.set(this.domNode, alertHTML);
                    domClass.remove(this.domNode, 'hidden');

                } else {
                    domClass.add(this.domNode, 'hidden');
                }
                runCallback.call(this, cb, 'update');
            });
        } catch (e) {
            logger.warn(this.id, e);
            domClass.add(this.domNode, 'hidden');
            runCallback.call(this, cb, 'update');
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
        }
    },

});
