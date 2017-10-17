/*eslint no-invalid-this: 0*/
import lang from 'dojo/_base/lang';
import { log } from '@/helpers';

export function execute(microflow, guid, cb) {
    if (microflow && guid) {
        log.call(this, 'execute microflow', `mf: ${microflow}:${guid}`);
        const action = {
            params: {
                applyto: 'selection',
                guids: [guid],
            },
            callback: lang.hitch(this, objs => {
                if (cb && 'function' == typeof cb) {
                    cb(objs);
                }
            }),
            error: lang.hitch(this, error => {
                mx.ui.error(`Error executing microflow ${microflow} : ${error.message}`);
                console.error(this.id + "._execMf", error);
            }),
        };

        if (!mx.version || mx.version && 7 > parseInt(mx.version.split(".")[ 0 ], 10)) {
            action.store = {
                caller: this.mxform,
            };
        } else {
            action.origin = this.mxform;
        }

        mx.data.action(action, this);
    }
}
