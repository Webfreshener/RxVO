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
import {
    _object, _schemaHelpers, _oBuilders, _dirtyModels
} from "./_references";
import {BaseModel} from "./base-model";
import {SchemaHelpers} from "./_schemaHelpers";
import {makeClean, makeDirty, refAtKeyValidation, refValidation} from "./utils";
import Notifiers from "./_branchNotifier";

const _observerDelegates = new WeakMap();

/**
 * @class ItemsModel
 */
export class ItemsModel extends BaseModel {
    /**
     * @constructor
     */
    constructor() {
        super(...arguments);
        _schemaHelpers.set(this, new SchemaHelpers(this));
        _object.set(this, new Proxy(BaseModel.createRef(this, []), this.handler));
    }

    /**
     * getter for object model
     */
    get model() {
        return _object.get(this);
    }

    /**
     * setter for object model
     * @param value
     */
    set model(value) {
        if (!Array.isArray(value)) {
            return `${this.path} invalid operation`;
        }

        if (this.isFrozen) {
            return false;
        }

        let _idx = 0;
        // value.forEach((itm) => {
        //     let _defaults = this.owner.getDefaultsForPath(this.jsonPath);
        //     if (Object.keys(_defaults).length) {
        //         value[_idx] = merge(_defaults, itm);
        //     }
        //     _idx++;
        // });

        if (refValidation(this, value) !== true) {
            Notifiers.get(this.owner).sendError(this.jsonPath, this.owner.errors);
            return `${JSON.stringify(this.owner.errors)}`;
        }

        if (!this.isDirty) {
            // marks model as dirty to prevent cascading validation calls
            makeDirty(this);
        }

        _oBuilders.get(this.owner).mute(this);
        _object.set(this, new Proxy(BaseModel.createRef(this, []), this.handler));
        _observerDelegates.set(this, true);

        try {
            let cnt = 0;
            value.forEach((val) => {
                _object.get(this)[cnt++] = val;
            });
        } catch (e) {
            makeClean(this);
            _oBuilders.get(this.owner).unmute(this);
            Notifiers.get(this.owner).sendError(this.jsonPath, e);
            return `${JSON.stringify(e)}`;
        }

        makeClean(this);

        if (!this.isDirty) {
            _oBuilders.get(this.owner).unmute(this);
            Notifiers.get(this.owner).sendNext(this.jsonPath);
            _observerDelegates.delete(this);
        }

        return true;
    }

    get handler() {
        return Object.assign(super.handler, {
            get: (t, idx) => {
                // TODO: review for removal
                // if (typeof idx === "symbol") {
                //     idx = `${String(idx)}`;
                // }

                if (idx === "length") {
                    return t.length;
                }

                if (idx in Array.prototype) {
                    // only handle methods that modify the reference array
                    if (["fill", "pop", "push", "shift", "splice", "unshift"].indexOf(idx) > -1) {
                        return applyMethod(this, t, idx);
                    } else {
                        return t[idx];
                    }
                }

                if (idx === "$model") {
                    return this;
                }

                return t[idx];
            },
            set: (t, idx, value) => {
                if (idx in Array.prototype) {
                    // do nothing against proto props
                    return true;
                }

                // -- ensures we aren't in a frozen hierarchy branch
                if (this.isFrozen) {
                    throw `model path "${this.path.length ? this.path : "."}" is non-configurable and non-writable`;
                }

                let _oDel = _observerDelegates.get(this);

                if (refAtKeyValidation(this, "items", value) !== true) {
                    if (_oDel !== void (0)) {
                        makeClean(this);
                        Notifiers.get(this.owner).sendError(this.jsonPath, this.owner.errors);
                    }
                    return `${JSON.stringify(this.owner.errors)}`;
                }

                // we set the value on the array with success
                if ((typeof value) === "object") {
                    let _sH = _schemaHelpers.get(this);
                    value = _sH.setChildObject(`${this.path}`, value);
                }

                t[idx] = value;
                return true;
            },

            deleteProperty: (t, idx) => {
                return deleteTrap(this, t, idx);
            }
        });
    }

    /**
     * Returns length of model array
     * @returns {number}
     */
    length() {
        return this.model.length();
    }
}

/**
 * Handles Proxy Delete Trap for Array elements
 * @param model
 * @param t
 * @param idx
 * @returns {boolean|string}
 */
const deleteTrap = (model, t, idx) => {
    let _oDel = _observerDelegates.get(model);
    // creates mock of future Model state for evaluation
    let _o = [].concat(t);
    try {
        // attempts splice method to
        // remove item at given index index
        _o.splice(idx, 1);
    } catch (e) {
        if (!_oDel) {
            makeClean(model);
            Notifiers.get(model.owner).sendError(model.jsonPath, e);
        }
        return `${JSON.stringify(e)}`;
    }

    // validates mock of change state
    const _res = refValidation(model, _o);


    if (_res !== true) {
        // makes clean and notifies
        // if not serial operation
        if (!_oDel) {
            makeClean(model);
            Notifiers.get(model.owner).sendError(model.jsonPath, _res);
        }
        return JSON.stringify(_res);
    }

    // applies operation
    t.splice(idx, 1);

    // flags model as in sync with tree
    makeClean(model);

    // updates observers
    Notifiers.get(model.owner).sendNext(model.jsonPath);
    return true;
};

/**
 * Handles proxy get for Array proto methods
 * @param model
 * @param t
 * @param idx
 * @returns {function(...[*]=)}
 */
const applyMethod = (model, t, idx) => {

    // returns closure analog to referenced method
    return (...args) => {
        // mocks current model state
        const _arr = [].concat(t);

        // applies method to model state
        const _val = t[idx].apply(_arr, args);

        // validates updated mock
        const _res = refValidation(model, _arr);

        // in event of validation failure
        if (_res !== true) {
            // .. marks model as clean
            makeClean(model);

            // .. sends notifications
            Notifiers.get(model.owner).sendError(model.jsonPath,
                model.owner.errors);

            return false;
        }

        // model is a kludge to handle updates from proto methods
        if (model.parent !== null) {
            // applies change to parent object if model is not root context
            model.parent.model[model.jsonPath.split(".").pop()] = _arr;
        } else {
            // applies change to Model instance
            model.owner.model = _arr;
        }

        return _val;
    }
};
