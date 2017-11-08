import Deferred from 'dojo/Deferred';
import lang from 'dojo/_base/lang';

export const getData = params => {
    const deferred = new Deferred();
    const getParams = lang.mixin({
        callback: deferred.resolve,
        error: deferred.reject,
    }, params);
    try {
        mx.data.get(getParams);
    } catch (e) {
        deferred.reject(e);
    }

    return deferred;
};

export const fetchAttr = (obj, attr) => {
    const deferred = new Deferred();
    try {
        obj.fetch(attr, val => deferred.resolve(val));
    } catch (e) {
        deferred.reject(e);
    }
    return deferred;
};
