// Copied from: https://github.com/jGleitz/markdown-it-prism/blob/master/index.js

import Prism from './prism';

const DEFAULTS = {
    plugins: [],
    init: () => { },
};

const loadPrismLang = lang => {
    const langObject = Prism.languages[ lang ];
    if ('undefined' === typeof langObject) {
        console.warn(`Language not found: ${lang}`);
    }
    return langObject;
};

const highlight = (markdownit, text, lang) => {
    const prismLang = loadPrismLang(lang);
    const code = prismLang ? Prism.highlight(text, prismLang) : markdownit.utils.escapeHtml(text);
    const classAttribute = lang ? ` class="${markdownit.options.langPrefix}${lang}"` : '';
    return `<pre${classAttribute}><code${classAttribute}>${code}</code></pre>`;
};

const markdownItPrism = (markdownit, useroptions) => {
    const md = markdownit;
    const options = Object.assign({}, DEFAULTS, useroptions);

    options.init(Prism);

    // register ourselves as highlighter
    md.options.highlight = (...args) => highlight(markdownit, ...args);
};

export default markdownItPrism;
