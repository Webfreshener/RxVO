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
import {_observers} from "./_references";
import {BehaviorSubject} from "rxjs/Rx";

const _observerPaths = new WeakMap();
const _observerCache = new WeakMap();

export class ObserverBuilder {
    /**
     * @constructor
     */
    constructor() {
        _observers.set(this, new WeakMap());
        _observerCache.set(this, new WeakMap());
        _observerPaths.set(this, {});
    }

    /**
     * Retrieves BehaviorSubject Collection for given Model
     * @param model {BaseModel}
     * @returns {Object|null} Observer at path reference
     */
    getObserverForModel(model) {
        return _observers.get(this).get(model) || null;
    }

    /**
     * Retrieves BehaviorSubject Collection for Model at given path
     * @param path {string}
     * @returns {*}
     */
    getObserverForPath(path) {
        const _oP = _observerPaths.get(this);
        return _oP.hasOwnProperty(path) ? _oP[path] : null;
    }

    /**
     * Lists all registered observer paths
     * @returns {[string]}
     */
    list() {
        return Object.keys(_observerPaths.get(this));
    }

    /**
     * Creates BehaviorSubjects for given Model
     * @param target {BaseModel}
     */
    create(target) {
        if (!target.path) {
            console.log(`invalid target: ${target} cname: ${target.constructor.name} target.path: ${target.path}`);
            throw ("target object is invalid");
        }

        const _oP = _observerPaths.get(this);

        if (_oP.hasOwnProperty(target.path)) {
            return _oP[target.path];
        }

        const _o = _observers.get(this);
        const _existing = this.getObserverForPath(target.path);
        if (_existing) {
            return _o.get(target);
        }

        const _h = {
            onNext: new BehaviorSubject(null).skip(1),
            onError: new BehaviorSubject(null).skip(1),
            onComplete: new BehaviorSubject(null).skip(1),
            path: target.path,
            jsonPath: target.jsonPath,
            targetId: target.objectID,
        };

        _o.set(target, _h);

        _observerPaths.set(this, Object.defineProperty(
            _observerPaths.get(this), `${target.path}`, {
                value: _h
            })
        );
        return _h;
    }

    /**
     * Mutes notifications to `target` observers
     * @param target
     */
    mute(target) {
        const _idx = this.list().indexOf(target.path);
        _observerCache.get(this).set(target, {idx: _idx, value: target.path});
    }

    /**
     * Unmutes notifications to `target` observers if muted
     * @param target
     */
    unmute(target) {
        _observerCache.get(this).delete(target);
    }

    /**
     * Calls next on Next Subject
     * @param target {BaseModel}
     */
    next(target) {
        if (!target || target.isDirty || _observerCache.get(target)) {
            return;
        }

        const _o = this.getObserverForPath(target.path) || null;
        if (_o) {
            _o.onNext.next(target);
        }
    }

    /**
     * Calls next on Complete Subject
     * @param target {BaseModel}
     */
    complete(target) {
        let _o = this.getObserverForModel(target);
        if (_o !== null) {
            _o.onComplete.next();
        }
    }

    /**
     * Calls next on Error Subject
     * @param target {BaseModel}
     * @param message {*}
     */
    error(target, message) {
        let _o = this.getObserverForModel(target);
        if (_o !== null) {
            _o.onError.next(message);
        }
    }
}
