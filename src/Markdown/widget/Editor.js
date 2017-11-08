import { defineWidget } from '@/helpers/widget';
import { log, runCallback } from '@/helpers';
import { fetchAttr } from '@/helpers/data';
import { fixFocusHandler } from '@/helpers/focus';

import Libraries from 'Libraries';

import domAttr from 'dojo/dom-attr';
import domClass from 'dojo/dom-class';
import debounce from 'dojo/debounce';
import dojoArray from 'dojo/_base/array';

import template from './Editor.template.html';

// The following code will be stripped with our webpack loader and should only be used if you plan on doing styling
/* develblock:start */
import loadcss from 'loadcss';
loadcss(`/widgets/Markdown/widget/ui/Editor.css`);
/* develblock:end */

import 'simplemde/dist/simplemde.min.css';

import 'prismjs/themes/prism.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import 'prismjs/plugins/toolbar/prism-toolbar.css';

import './Editor.scss';

import SimpleMDE from 'simplemde';

// Blatantly copied from SimpleMDE to do my own inserts
function _replaceSelection(cm, active, startEnd, url) {
    if (/editor-preview-active/.test(cm.getWrapperElement().lastChild.className)){
        return;
    }

    let text;
    let start = startEnd[ 0 ];
    let end = startEnd[ 1 ];
    const startPoint = cm.getCursor("start");
    const endPoint = cm.getCursor("end");
    if (url) {
        end = end.replace("#url#", url);
    }
    if (active) {
        text = cm.getLine(startPoint.line);
        start = text.slice(0, startPoint.ch);
        end = text.slice(startPoint.ch);
        cm.replaceRange(start + end, {
            line: startPoint.line,
            ch: 0,
        });
    } else {
        text = cm.getSelection();
        cm.replaceSelection(start + text + end);

        startPoint.ch += start.length;
        if (startPoint !== endPoint) {
            endPoint.ch += start.length;
        }
    }
    cm.setSelection(startPoint, endPoint);
    cm.focus();
}


export default defineWidget('Editor', template, {

    // Set in Modeler
    mdAttr: '',

    // DOM ELEMENTS
    textAreaNode: null,

    // Internal
    _obj: null,
    _editor: null,
    _md: null,
    _setup: false,
    _aspectHandler: null,
    _saveTimeout: null,

    // Called after the widget is initialized
    postCreate() {
        log.call(this, 'postCreate', this._WIDGET_VERSION);
        domAttr.set(this.domNode, 'data-widget-version', this._WIDGET_VERSION);

        // Fix aspect focus handler. This mxui.wm.focus.onfocus screws with our editor. Disabling within our widget
        this._aspectHandler = fixFocusHandler(this.domNode);
        this._addOnDestroyFuncs();
        this._createConverter();

        // window._WIDGET = this; // TODO: REMOVE
    },

    _createConverter() {
        log.call(this, '_createConverter');
        this.createMD({
            html: this.optHtml,
            xhtmlOut: this.optxHtmlOut,
            linkify: this.optLinkify,
            typographer: this.optTypographer,
            breaks: this.optBreaks,
        });
    },

    update(obj, cb) {
        this._obj = obj;

        if (!this._setup) {
            this._setupEditor();
            this._setup = true;
        }

        if (this._obj) {
            this._updateRendering(cb);
        } else {
            this._setVisibility(false);
            runCallback.call(this, cb, 'update');
        }
    },

    // It's better to add functions onDestroy and not overwrite the normal unintialize function
    _addOnDestroyFuncs() {
        this.addOnDestroy(() => {
            if (this._aspectHandler) {
                this._aspectHandler.remove();
            }
        });
    },

    _isDirty() {
        // Check if we've changed something
        return !this._editor.codemirror.isClean();
    },

    _setupEditor() {
        log.call(this, '_setupEditor');

        this._editor = new SimpleMDE({
            element: this.textAreaNode,
            autofocus: true,
            indentWithTabs: false,
            previewRender: (plainText, preview) => {
                const previewEl = preview;
                this._getHTML(plainText, html => {
                    previewEl.innerHTML = html;
                });
            },
            insertTexts: {
                horizontalRule: [
                    "",
                    "\n\n-----\n\n",
                ],
                image: [
                    "![](http://",
                    ")",
                ],
                link: [
                    "[",
                    "](http://)",
                ],
                table: [
                    "",
                    "\n\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Text     | Text      | Text     |\n\n",
                ],
                alert: [
                    "::: alert info\n",
                    "\n:::",
                ],
            },
            toolbar: this._getToolbars(),
        });

        this._editor.codemirror.on('change', debounce(() => {
            const val = this._editor.value();
            this._obj.set(this.mdAttr, val);
        }, 250));
    },

    _getToolbars() {
        const toolbarArray = [
            'bold',
            'italic',
            'heading',
            '|',
            'quote',
            'unordered-list',
            'ordered-list',
            'clean-block',
            'code',
            '|',
            'link',
            'image',
            'table',
            {
                name: "alert",
                action: editor => {
                    const cm = editor.codemirror;
                    const stat = this._editor.getState();
                    const options = this._editor.options;

                    _replaceSelection(cm, stat.alert, options.insertTexts.alert);
                },
                className: "fa fa-exclamation-circle",
                title: "Alert",
            },
            '|',
            'preview',
            'side-by-side',
            'fullscreen',
            '|',
            'guide',
            '|',
            this._snippetsUsed() ? '|' : null,
            'undo',
            'redo',
        ];
        return dojoArray.filter(toolbarArray, item => null !== item);
    },

    _setVisibility(visible) {
        domClass.toggle(this.domNode, 'hidden', !visible);
    },

    _updateRendering(cb) {
        log.call(this, '_updateRendering');

        fetchAttr(this._obj, this.mdAttr)
            .then(value => {
                this._setVisibility(true);
                if (this._editor) {
                    if (!this._isDirty()) {
                        this._editor.value(value);
                    }
                }
                runCallback.call(this, cb, '_updateRendering');
            }, e => {
                this._setVisibility(false);
                console.warn(`Error fetching ${this.mdAttr} from context object`, e);
                runCallback.call(this, cb, '_updateRendering');
            });

        this._resetSubscriptions();
    },

    _resetSubscriptions() {
        log.call(this, '_resetSubscriptions');
        this.unsubscribeAll();

        if (this._obj) {
            this.subscribe({
                guid: this._obj.getGuid(),
                callback: this._updateRendering,
            });

            this.subscribe({
                guid: this._obj.getGuid(),
                attr: this.mdAttr,
                callback: this._updateRendering,
            });
        }
    },
}, Libraries);
