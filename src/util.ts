import * as isObject from 'lodash.isobject';
import * as forEach from 'lodash.foreach';

interface ComposeFunc {
  (): void;
}

/**
 * Recursively add proxy to object
 * @param {object} value - value of object type
 * @param {object} handler - proxy handler
 * @return {object} new proxy object
 */
/* eslint no-param-reassign: 0 */
export function addProxy(value: object, handler: object): object {
  if (!value || Object.isFrozen(value)) {
    return value;
  }
  forEach(value, (item, key) => {
    if (isObject(item)) {
      value[key] = addProxy(item, handler);
    }
  });
  return new Proxy(value, handler);
}

/**
 * Convert proxied value to plain js object
 * @param {any} value - js value of any type
 * @return {any} plain js type
 */
export function toJS(value: any): any {
  if (!value || !isObject(value)) {
    return value;
  }

  const newValue = Array.isArray(value) ? [] : {};
  forEach(value, (item, key) => {
    if (isObject(item)) {
      newValue[key] = toJS(item);
    } else {
      newValue[key] = item;
    }
  });
  return newValue;
}

/**
 * Compose a middleware chain consisting of all the middlewares
 * @param {array} middlewares - middlewares user passed
 * @param {object} ctx - excuting context of middleware functions
 * @param {string} actionType - function name of the action triggered
 * @return {function} middleware chain
 */
export function compose(middlewares: (() => void)[], ctx: object, actionType: string): ComposeFunc {
  return async (...args) => {
    function goNext(middleware, next) {
      return async () => {
        await middleware(ctx, next, actionType, ...args);
      };
    }
    let next = async () => {
      Promise.resolve();
    };
    middlewares.slice().reverse().forEach((middleware) => {
      next = goNext(middleware, next);
    });
    try {
      await next();
    } catch (e) {
      console.error(e);
    }
  };
}
