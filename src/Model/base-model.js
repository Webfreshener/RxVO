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
    _mdRef, _oBuilders, _object, _schemaOptions, _dirtyModels
} from "./_references";
import {Model} from "./index";
import {MetaData} from "./_metaData";
import {makeClean, makeDirty, validate} from "./utils";
import {Pipeline} from "../Pipeline";
/**
 *
 * @param ref
 * @param metaRef
 */
const createMetaDataRef = (ref, metaRef, path) => {
    let _md;
    if (metaRef instanceof Model) {
        // root properties are handed the Model object
        // will create new MetaData and set reference as root element
        _md = new MetaData(ref, {
            _path: path || "root#",
            _parent: null,
            _root: ref,
            _owner: metaRef || null,
        });
    } else if ((typeof metaRef) === "object") {
        // extends MetaData reference
        if (metaRef instanceof MetaData) {
            _md = metaRef;
        } else {
            // todo: re-evaluate this line for possible removal
            _md = new MetaData(ref, metaRef);
        }
    } else {
        throw "Invalid attempt to construct Model." +
        "tip: use `new Model([schema])` instead"
    }
    // sets MetaData object to global reference
    _mdRef.set(ref, _md);
};

/**
 *
 */
export class BaseModel {
    constructor() {
        createMetaDataRef(this, ...arguments);
    }

    /**
     * Subscribes handler method to observer for model
     * @param func
     * @returns {object}
     */
    subscribe(func) {
        return this.subscribeTo(this.path, func);
    }

    /**
     * Subscribes handler method to property observer for path
     * @param path
     * @param func
     * @return {object}
     */
    subscribeTo(path, func) {
        const _oBuilder = _oBuilders.get(this.owner);
        let _o = _oBuilder.getObserverForPath(path);
        if (!_o) {
            console.log(`no observer for ${path}. Registered Observers: ${_oBuilder.list()}`);
            // return false;
            _o = _oBuilder.create(this, `${this.path}`);
        }

        // support next handler being passed directly
        // todo: review other valid manners of passing observer callbacks
        if ((typeof func) === "function") {
            func = {next: func};
        }

        // references to subscriptions for Observable
        const _subRefs = [];

        // inits observer handlers if defined on passed `func` object
        [
            {call: "onNext", func: "next"},
            {call: "onError", func: "error"},
            {call: "onComplete", func: "complete"},
        ].forEach((obs) => {
            if (func.hasOwnProperty(obs.func)) {
                _subRefs.push( _o[obs.call].subscribe({next: func[obs.func]}) );
            }
        });

        // creates an extensible object to hold our unsubscribe method
        // and adds unsubscribe calls to the Proto object
        const _subs = class { };

        // adds unsubscribe to the Proto object
        _subs.prototype.unsubscribe = () => {
            _subRefs.forEach((sub) => {
                sub.unsubscribe();
            });
        };

        return new _subs();
    }

    /**
     * Tests value for validation without setting value to Model
     * @param {json} value - JSON value to validate for validity
     * @return {boolean}
     */
    validate(value) {
        try {
            return validate(this, this.validationPath, value);
        } catch (e) {
            // couldn't find schema, so is Additional Properties
            // todo: review `removeAdditional` ajv option for related behavior
            return true;
        }
    }

    /**
     * resets Model to empty value
     * @return {BaseModel}
     */
    reset() {
        const _isArray = Array.isArray(this.model);
        const _o = !_isArray ? {} : [];
        const _res = this.validate(_o);
        // validates that this model be returned to an empty value
        if (_res !== true) {
            _oBuilders.get(this.owner).error(this, _res);
            return this;
        }

        // marks this model as out of sync with tree
        makeDirty(this);

        // closure to handle the freeze operation safely
        const _freeze = (itm) => {
            if (!Object.isFrozen(itm)) {
                itm.freeze();
            }
        };

        // freezes all child Model/Elements
        // -- prevent changes to Children
        // -- sends "complete" notification to their Observers
        // -- revokes their Models if revocable
        const _i = !_isArray ? Object.keys(this.model) : this.model;
        _i.forEach((itm) => _freeze((!_isArray) ? _i[itm] : itm));

        // creates new Proxied Model to operate on
        const _p = new Proxy(BaseModel.createRef(this, _o), this.handler);
        _object.set(this, _p);

        // marks this model as back in sync with tree
        makeClean(this);

        // sends notification of model change
        _oBuilders.get(this.owner).next(this);

        return this;
    }

    /**
     * Raw value of this Model
     * @returns {*}
     */
    valueOf() {
        return _object.get(this);
    }

    /**
     * Provides JSON object representation of Model
     */
    toJSON() {
        let _derive = (itm) => {
            // uses toJSON impl if defined
            if (itm.hasOwnProperty("toJSON") &&
                (typeof this.toJSON) === "function") {
                return itm.toJSON();
            }

            // builds new JSON tree if value is object
            if (typeof itm === "object") {
                const _o = !Array.isArray(itm) ? {} : [];
                for (let k in itm) {

                    // we validate for property to avoid warnings
                    if (itm.hasOwnProperty(k)) {

                        // applies property to tree
                        _o[k] = _derive(itm[k]);
                    }
                }

                // returns new JSON tree
                return _o;
            }
            // hands back itm if value wasn't usable
            return itm;
        };

        // uses closure for evaluation
        return _derive(this.valueOf());
    }

    /**
     * Provides JSON String representation of Model
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this.toJSON());
    }

    /**
     * Applies Object.freeze to model and triggers complete notification
     * -- unlike Object.freeze, this prevents modification
     * -- to all children in Model hierarchy
     * @returns {BaseModel}
     */
    freeze() {
        Object.freeze(_object.get(this));
        _oBuilders.get(this.owner).complete(this);
        return this;
    }

    /**
     *
     * @return {object}
     */
    get handler() {
        return {
            setPrototypeOf: () => false,
            isExtensible: (t) => Object.isExtensible(t),
            preventExtensions: (t) => Object.preventExtensions(t),
            getOwnPropertyDescriptor: (t, key) => Object.getOwnPropertyDescriptor(t, key),
            defineProperty: (t, key, desc) => Object.defineProperty(t, key, desc),
            has: (t, key) => key in t,
            ownKeys: (t) => Reflect.ownKeys(t),
            apply: () => false,
        };
    }

    /**
     * stub for model getter, overridden by Model sub-class
     * @return {object|array|null}
     */
    get model() {
        return null;
    }

    /**
     * Getter for Model's Unique Object ID
     * @returns {string} Object ID for Model
     */
    get objectID() {
        return _mdRef.get(this)._id;
        // return _mdRef.get(this).objectID;
    }

    /**
     * Getter for root element of Model hierarchy
     * @returns {BaseModel}
     */
    get root() {
        return _mdRef.get(this)._root || this;
    }

    /**
     * Getter for `path` to current Element
     * @returns {string}
     */
    get path() {
        return _mdRef.get(this).path;
    }

    /**
     * Getter for path to JSON Object for Model
     * @returns {string}
     */
    get jsonPath() {
        const __ = this.path.replace(/\/?(properties|items)+\/?/g, "/").split("/");
        __.shift();
        return __.join(".");
    }

    /**
     * Getter for Model's parent
     * @returns {BaseModel}
     */
    get parent() {
        // attempts to get parent
        return _mdRef.get(this).parent || null;
    }

    /**
     * Getter for Model validation status for hierarchy
     * @returns {boolean}
     */
    get isDirty() {
        let _res = _dirtyModels.get(this.owner)[this.path] || false;
        return _res || ((this.parent === null) ? false : this.parent.isDirty);
    }

    /**
     * Getter for model's Model owner object
     * @returns {Model}
     */
    get owner() {
        return _mdRef.get(this).owner;
    }

    /**
     * Get options (if any) for this model's schema
     * todo: review for possible removal
     * @returns {any}
     */
    get options() {
        return _schemaOptions.get(this);
    }

    /**
     * Getter for Object.isFrozen status of this node and it's ancestors
     * @returns {boolean}
     */
    get isFrozen() {
        let _res = Object.isFrozen(_object.get(this));
        return !_res ? ((this.parent === null) ? false : this.parent.isFrozen) : _res;
    }

    /**
     * Provides formatted string for json-schema lookup
     * @returns {string}
     */
    get validationPath() {
        return this.path === "" ? "/" : `${this.path}`;
    }

    /**
     * todo: add tests
     * @returns {*}
     */
    get schema() {
        return this.owner.getSchemaForPath(this.path);
    }

    /**
     * creates owner Model reference on Proxied data object
     * @param ref
     * @param obj
     * @returns {*}
     */
    static createRef(ref, obj) {
        Object.defineProperty(obj, "$model", {
            value: ref,
            writable: false
        });
        return obj;
    };

    /**
     * returns `pipeline` segment for process chaining
     * @param pipesOrSchemas
     * @returns {Pipeline}
     */
    pipeline(...pipesOrSchemas) {
        const _p = new Pipeline(...pipesOrSchemas);
        const _sub = this.subscribe({
            next: (d) => {
                _p.write(d);
            },
            complete: () => {
                _sub.unsubscribe();
                _p.close();
            }
        });
        return _p;
    }
}
