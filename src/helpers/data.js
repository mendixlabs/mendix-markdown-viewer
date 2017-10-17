import Promise from 'dojo/promise/Promise';

export const getData = params => new Promise((resolve, reject) => {
    mx.data.get({
        params,
        callback: resolve,
        error: reject,
    });
});

export const getAttribute = (obj, attr) => new Promise((resolve, reject) => {
    if (!attr) {
        return reject(new Error('Should have an attribute'));
    }
    if (!obj || 'undefined' === typeof obj.fetch) {
        return reject(new Error('Object should be a Mendix object'));
    }
    try {
        obj.fetch(attr, val => {
            resolve(val);
        });
    } catch (e) {
        reject(e);
    }

});
