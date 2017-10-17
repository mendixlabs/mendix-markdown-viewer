import { defineWidget } from '@/helpers/widget';
import { log, runCallback } from '@/helpers';

import domClass from 'dojo/dom-class';
import domAttr from 'dojo/dom-attr';
import html from 'dojo/html';

import Markdown from 'markdown-it';

import './Viewer.scss';

export default defineWidget('Viewer', false, {

    // Set in the modeler
    attrText: '',

    // Internal properties
    _text: '',
    _converter: null,

    _obj: null,

    postCreate() {
        log.call(this, 'postCreate', this._WIDGET_VERSION);
        domAttr.set(this.domNode, 'data-widget-version', this._WIDGET_VERSION);
        this._converter = new Markdown();
    },

    update(obj, cb) {
        log.call(this, 'update');

        this._obj = obj;
        this.resetSubscriptions();

        if (obj && this.attrText) {
            this.updateRendering(cb);
        } else {
            runCallback.call(this, cb, 'update');
        }
    },

    updateRendering(cb) {
        try {
            this._obj.fetch(this.attrText, val => {
                this._text = val;
                if (val && '' !== val) {
                    const alertHTML = this._converter.render(this._text);

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

    resetSubscriptions() {
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
                                this.updateRendering();
                            }
                        },
                    });
                },
            });
        }
    },

});
