/*eslint no-invalid-this: 0*/

/**
 * Logs using the Mendix logger
 *
 * @export
 * @param {string} methodName
 * @param {...any} args
 */
export function log(methodName, ...args) {
    logger.debug(`${this.id}.${methodName}`, args.length ? args[ 0 ] : '');
}

/**
 * Runs a callback and logs the method where it comes from
 *
 * @export
 * @param {() => {}} cb
 * @param {string} from
 */
export function runCallback(cb, from) {
    log.call(this, '_callback', from ? `from ${from}` : '');
    if (cb && 'function' === typeof cb) {
        cb();
    }
}
