/*eslint no-invalid-this: 0*/
import lang from 'dojo/_base/lang';
import { log } from '@/helpers';
import Promise from 'dojo/promise/Promise';

export function execute(microflow, guid, cb, errCb) {
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
                if (errCb && 'function' == typeof errCb) {
                    errCb(error);
                } else {
                    mx.ui.error(`Error executing microflow ${microflow} : ${error.message}`);
                    console.error(this.id + "._execMf", error);
                }
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

export function executePromise(microflow, guid) {
    return new Promise((resolve, reject) => {
        execute(microflow, guid, resolve, reject);
    });
}
