import { defineWidget } from '@/helpers/widget';
import { runCallback } from '@/helpers';
import { fetchAttr } from '@/helpers/data';
import { fixFocusHandler } from '@/helpers/focus';

import Libraries from 'Libraries';

import domAttr from 'dojo/dom-attr';
import domClass from 'dojo/dom-class';
import debounce from 'dojo/debounce';

import template from './Editor.template.html';

import {
    executeMicroflow,
    executeNanoflow,
    openPage,
} from "@jeltemx/mendix-react-widget-utils";

// The following code will be stripped with our webpack loader and should only be used if you plan on doing styling
/* develblock:start */
import loadcss from 'loadcss';
loadcss(`/widgets/Markdown/widget/ui/Editor.css`);
/* develblock:end */

import 'simplemde/dist/simplemde.min.css';
import 'prismjs/themes/prism.css';
import './Editor.scss';

import SimpleMDE from 'simplemde';
import 'codemirror/addon/display/rulers';

// Blatantly copied from SimpleMDE to do my own inserts
function _replaceSelection(cm, startEnd) {
    if (/editor-preview-active/.test(cm.getWrapperElement().lastChild.className)){
        return;
    }

    const start = startEnd[ 0 ];
    const end = startEnd[ 1 ];
    const startPoint = cm.getCursor("start");
    const endPoint = cm.getCursor("end");
    const text = cm.getSelection();
    cm.replaceSelection(start + text + end);
    startPoint.ch += start.length;
    if (startPoint !== endPoint) {
        endPoint.ch += start.length;
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
        mx.logger.debug(this.id + '_postCreate', this._WIDGET_VERSION);
        domAttr.set(this.domNode, 'data-widget-version', this._WIDGET_VERSION);

        // Fix aspect focus handler. This mxui.wm.focus.onfocus screws with our editor. Disabling within our widget
        this._aspectHandler = fixFocusHandler(this.domNode);
        this._addOnDestroyFuncs();
        this._createConverter();
    },

    _createConverter() {
        mx.logger.debug(this.id + '_createConverter');
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

    _setupEditor() {
        mx.logger.debug(this.id + '_setupEditor');

        this._editor = new SimpleMDE({
            element: this.textAreaNode,
            autofocus: true,
            spellChecker: this.optSpellChecker,
            previewRender: plainText => {
                return this._md.render(plainText); // Returns HTML from a custom parser
            },
            hideIcons: this.toolbarHideIcons.split(" "),
            insertTexts: {
                horizontalRule: [
                    "",
                    "\n\n-----\n\n",
                ],
                image: [
                    "![](https://",
                    ")",
                ],
                link: [
                    "[",
                    "](https://)",
                ],
                table: [
                    "",
                    "\n\n| Kolom 1 | Kolom 2 | Kolom 3 |\n| -------- | -------- | -------- |\n| Tekst     | Tekst      | Tekst     |\n\n",
                ],
                alert: [
                    "::: alert info\n",
                    "\n:::",
                ],
                alignLeft: [
                    "<= ",
                    " <=",
                ],
                alignCenter: [
                    "=> ",
                    " <=",
                ],
                alignRight: [
                    "=> ",
                    " =>",
                ],
                alignJustify: [
                    "<= ",
                    " =>",
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
        const buttonArray = [
            'bold',
            'italic',
            'heading',
            '|',
            {
                name: "align-left",
                action: editor => {
                    _replaceSelection(editor.codemirror, editor.options.insertTexts.alignLeft);
                },
                className: "fa fa-align-left",
                title: "Links uitlijnen",
            },
            {
                name: "align-center",
                action: editor => {
                    _replaceSelection(editor.codemirror, editor.options.insertTexts.alignCenter);
                },
                className: "fa fa-align-center",
                title: "Midden uitlijnen",
            },
            {
                name: "align-left",
                action: editor => {
                    _replaceSelection(editor.codemirror, editor.options.insertTexts.alignRight);
                },
                className: "fa fa-align-right",
                title: "Rechts uitlijnen",
            },
            {
                name: "align-justify",
                action: editor => {
                    _replaceSelection(editor.codemirror, editor.options.insertTexts.alignJustify);
                },
                className: "fa fa-align-justify",
                title: "Tekst uitvullen",
            },
            '|',
            'quote',
            'unordered-list',
            'ordered-list',
            'clean-block',
            'code',
            '|',
            'horizontal-rule',
            'link',
            'image',
            'table',
            {
                name: "alert",
                action: editor => {
                    _replaceSelection(editor.codemirror, editor.options.insertTexts.alert);
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
            'undo',
            'redo',
        ];
        if(this.toolbarButtons){
            buttonArray.push('|');
            this.toolbarButtons.map(button => {
                buttonArray.push({
                    name: button.actionButtonTooltip,
                    action: () => {
                        if ("open" === button.actionButtonOnClickAction){
                            openPage({
                                pageName: button.actionButtonOnClickForm,
                                openAs: button.actionButtonOnClickOpenPageAs,
                            }, this.mxcontext, true);
                        }
                        if ("mf" === button.actionButtonOnClickAction){
                            executeMicroflow(button.actionButtonOnClickMf, this.mxcontext, this.mxform, true);
                        }
                        if ("nf" === button.actionButtonOnClickAction){
                            executeNanoflow(button.actionButtonOnClickNf, this.mxcontext, this.mxform, true);
                        }
                    },
                    className: button.actionButtonIconClass,
                    title: button.actionButtonTooltip,
                });
            });
        }
        return buttonArray;
    },

    _setVisibility(visible) {
        domClass.toggle(this.domNode, 'hidden', !visible);
    },

    _isClean() {
        // Check if we've changed something
        return this._editor.codemirror.isClean();
    },

    _updateRendering(cb) {
        mx.logger.debug(this.id + '_updateRendering');

        const editor = this._editor;

        fetchAttr(this._obj, this.mdAttr)
            .then(value => {
                this._setVisibility(true);
                if (editor) {
                    if (this._isClean()) {
                        editor.value(value);
                    } else if (value !== editor.value()) {
                        editor.value(value);
                        const cm = editor.codemirror;
                        cm.focus();
                        cm.setCursor(cm.lineCount(), 0);
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
        mx.logger.debug(this.id + '_resetSubscriptions');
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
