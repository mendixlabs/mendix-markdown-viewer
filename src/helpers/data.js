import Deferred from 'dojo/Deferred';

export const getData = params => {
    const deferred = new Deferred();
    mx.data.get({
        params,
        callback: deferred.resolve,
        error: deferred.reject,
    });
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
