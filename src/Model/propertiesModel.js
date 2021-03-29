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
    _object, _schemaHelpers,
} from "./_references";
import {
    makeClean, makeDirty,
    refAtKeyValidation, refValidation,
} from "./utils";
import {SchemaHelpers} from "./_schemaHelpers";
import {BaseModel} from "./base-model";
import Notifiers from "./_branchNotifier";

/**
 * @class PropertiesModel
 */
export class PropertiesModel extends BaseModel {
    /**
     *
     */
    constructor() {
        super(...arguments);

        // stores SchemaHelpers reference for use
        _schemaHelpers.set(this, new SchemaHelpers(this));

        // sets Proxy Model reference on map
        _object.set(this, new Proxy(BaseModel.createRef(this, {}), this.handler));
    }

    /**
     * Handler for Object Proxy Evaluation
     * @returns {{get: function, set: function}}
     */
    get handler() {
        return Object.assign(super.handler, {
            get: (t, key) => {
                return key === "$model" ? this : t[key];
            },
            set: (t, key, value) => {
                return setHandler(this, t, key, value);
            },
            deleteProperty: (t, key) => {
                return deleteHandler(this, t, key);
            }
        });
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
        // fails on attempts to set scalar value
        // or if this node is locked or fails validation
        if ((typeof value) !== "object" || this.isFrozen) {
            return false;
        }

        if (refValidation(this, value) !== true) {
            Notifiers.get(this.owner).sendError(this.jsonPath, this.owner.errors);
            return false;
        }

        if (!this.isDirty) {
            // marks model as dirty to prevent cascading validation calls
            makeDirty(this);
        }

        // defines new Proxy Object for data modeling
        _object.set(this,
            new Proxy(BaseModel.createRef(this, {}), this.handler));

        Object.keys(value).forEach((k) => {
            // -- added try/catch to avoid error in JSFiddle
            try {
                this.model[k] = value[k];
            } catch (e) {
                // marks model as clean
                makeClean(this);
                // sends notifications
                Notifiers.get(this.owner).sendError(this.jsonPath, e.message);
                return false;
            }
        });

        // setTimeout(() => {
            // marks model as in sync with tree
            makeClean(this);
        // }, 0);

        // calls next's observable to update subscribers
        if ((this.parent && !this.parent.isDirty) || !this.isDirty) {
            Notifiers.get(this.owner).sendNext(this.jsonPath);
        }

        return true;
    }

    /**
     * @param {string} key
     * @returns {any}
     */
    get(key) {
        return this.model[key];
    }

    /**
     * sets value to schema key
     * @param {string|object} key
     * @param {any} value
     */
    set(key, value) {
        // attempts validation of value against schema
        if (!refAtKeyValidation(this, key, value)) {
            return false;
        }

        if (!this.isDirty) {
            // marks model as dirty to prevent cascading validation calls
            makeDirty(this);
        }

        // applies validated value to model
        this.model[key] = value;

        // updates observers
        Notifiers.get(this.owner).sendNext(this.jsonPath);

        // removes dirtiness
        makeClean(this);

        return this;
    }
}

/**
 * Negotiates Key values that are Objects
 * @param model
 * @param key
 * @returns {boolean}
 */
const handleObjectKey = (model, key) => {
    const _sH = _schemaHelpers.get(model);
    const e = _sH.setObject(key);
    if (typeof e === "string") {
        makeClean(model);
        Notifiers.get(model.owner).sendError(model.jsonPath, e);
        return false;
    }

    return true;
};

/**
 * Creates Model Child to set up Proxy Object
 * @param model
 * @param key
 * @param value
 * @returns {*}
 */
const createModelChild = (model, key, value) => {
    const _sH = _schemaHelpers.get(model);
    // calls validate with either full path if in PropertiesModel or key if nested in ItemsModel
    value = _sH.setChildObject(key, value);
    if ((typeof value) === "string") {
        // marks model as clean
        makeClean(model);
        // sends notifications
        Notifiers.get(model.owner).sendError(model.jsonPath, value);
        return false;
    }
    return value;
};

/**
 * Parameter Set trap for Proxy
 * @param model
 * @param t
 * @param key
 * @param value
 * @returns {boolean|string}
 */
const setHandler = (model, t, key, value) => {
    if (key in Object.prototype) {
        // do nothing against proto props
        return true;
    }

    // -- ensures we aren't in a frozen hierarchy branch
    if (model.isFrozen) {
        throw `model path "${model.path.length ? model.path : "."}" is non-configurable and non-writable`;
    }

    // checks for branch update status
    if (!model.isDirty) {
        let _o = Object.assign({}, t);
        _o[key] = value;
        // attempts validation of value update
        if (refValidation(model, _o) !== true) {
            makeClean(model);
            Notifiers.get(model.owner).sendError(model.jsonPath, model.owner.errors);
            return `${JSON.stringify(model.owner.errors)}`;
        }
    }

    // if key is type 'object', we will set directly
    if (typeof key === "object") {
        return handleObjectKey(model, key);
    }

    if ((typeof value) === "object") {
        if ((value = createModelChild(model, key, value)) === false) {
            return `${model.path} unable to create child object`;
        }
    }

    // performs the operation on Model
    t[key] = value;
    return true;
};


/**
 * Parameter Delete trap for Proxy
 * @param model
 * @param t
 * @param key
 * @returns {boolean}
 */
const deleteHandler = (model, t, key) => {
    // creates mock of future model state for evaluation
    let _o = Object.assign({}, model.model);
    delete _o[key];
    const _res = model.validate(_o);

    // validates model with value removed
    if (_res !== true) {
        Notifiers.get(model.owner).sendError(model.jsonPath, _res);
        return _res;
    }

    // performs delete operation on model
    delete t[key];
    return true;
};
