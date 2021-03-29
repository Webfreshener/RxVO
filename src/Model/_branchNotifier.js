/* ############################################################################
The MIT License (MIT)

Copyright (c) 2016 - 2019 Van Schroeder
Copyright (c) 2017-2019 Webfreshener, LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

############################################################################ */
import {_oBuilders} from "./_references";

const notifiers = new WeakMap();

/**
 * protocol for Errors
 */
class ErrorNotification {
    /**
     * @constructor
     * @param {string} path
     * @param {string|string[]} error
     */
    constructor(path, error) {
        // defines getter for `path` prop
        Object.defineProperty(this, "path", {
            get: () => path,
            enumerable: true,
        });
        // defines getter for `error` prop
        Object.defineProperty(this, "error", {
            get: () => error,
            enumerable: true,
        });
    }

    toString() {
        return `"${this.path}": ${JSON.stringify(this.error)}`;
    }
}

/**
 * todo: implement this somewhere
 */
class CompleteNotification {
    /**
     * @constructor
     * @param {string} path
     */
    constructor(path) {
        Object.defineProperty(this, "path", {
            get: () => path,
            enumerable: true,
        });
    }
}

/**
 * Notification Management
 * acts as liason between Models and RxJS Subscription Dispatchers
 */
class Notifier {
    /**
     *
     * @param owner
     * @returns {Notifier|*}
     */
    constructor(owner) {
        Object.defineProperty(this, "$owner", {
            get: () => owner,
        });

        notifiers.set(owner, this);
    }

    /**
     * Delegates sending RxJS `next` notifications
     * @param forPath
     */
    sendNext(forPath) {
        setTimeout(() => {
            this.$owner.getModelsInPath(forPath).forEach(
                (m) => {
                    _oBuilders.get(this.$owner).next(m.$model)
                }
            );
        }, 0);
    }

    /**
     * Delegates sending RxJS `error` notifications
     * @param forPath
     * @param error
     */
    sendError(forPath, error) {
        this.$owner.getModelsInPath(forPath)
            .forEach((model) => _oBuilders.get(this.$owner).error(model.$model,
                new ErrorNotification(model.$model.path, error)));
    }

    /**
     * Delegates sending RxJS `complete` notifications
     * @param forPath
     */
    sendComplete(forPath) {
        this.$owner.getModelsInPath(forPath)
            .forEach((model) => _oBuilders.get(this.$owner).complete(model.$model));
    }
}

/**
 * Creates and Retrives Notification Handlers
 * @static
 */
export default class Notifiers {
    /**
     *
     * @param owner
     * @returns {*}
     */
    static create(owner) {
        new Notifier(owner);
        return notifiers.get(owner);
    }

    /**
     *
     * @param owner
     * @returns {*}
     */
    static get(owner) {
        return notifiers.get(owner);
    }
}
