import declare from 'dojoBaseDeclare';
import widgetBase from 'widgetBase';
import templateMixin from 'dijit/_TemplatedMixin';

const { packageName, version, widgetFolder } = config;

/**
 * Defines a widget. Use this when you have multiple sub widgets. For a single widget this might be overkill
 *
 * @export
 * @param {string} id
 * @param {string} template
 * @param {{}}} obj
 * @param {any} base
 * @returns
 */
export function defineWidget(id, template, obj, base) {
    const widgetObj = obj;

    widgetObj._WIDGET_VERSION = version;

    const mixins = [];
    if ('undefined' !== typeof base) {
        if (null !== base) {
            mixins.push(base);
        }
    } else {
        mixins.push(widgetBase);
    }

    if (template) {
        mixins.push(templateMixin);
    }
    if ('boolean' !== typeof template){
        widgetObj.templateString = template;
    }

    return declare(`${packageName}.${widgetFolder}.${id}`, mixins, widgetObj);
}
