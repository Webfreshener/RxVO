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
import {_mdRef, _oBuilders} from "./_references";
import {MetaData} from "./_metaData";
import {PropertiesModel} from "./propertiesModel";
import {ItemsModel} from "./itemsModel";

/**
 * @private
 */
export class SchemaHelpers {
    /**
     * @constructor
     */
    constructor(_ref) {
        if (!_ref || (typeof _ref) !== "object") {
            throw new Error("arguments[0] must be an object");
        }

        this._ref = _ref;
        Object.seal(this);
    }

    /**
     * Sets Object key/values upon PropertiesModel Reference
     * @param obj
     * @returns {*}
     */
    setObject(obj) {
        if (typeof obj === "string") {
            return obj;
        }
        // calls set with nested key value pair
        Object.keys(obj).forEach((k) => {
            let eMsg = this._ref.set(k, obj[k]);
            if (typeof eMsg === "string") {
                throw new Error(eMsg);
            }
        });
        return this._ref;
    }

    /**
     * Creates Child Model and set data on it
     * @param key
     * @param value
     * @returns {*}
     */
    setChildObject(key, value) {
        let _mdData = _mdRef.get(this._ref);
        let _s = this.createSchemaChild(key, value, _mdData);
        // creates Observables for new Child Model
        _oBuilders.get(this._ref.owner).create(_s);

        if (typeof _s === "string") {
            return _s;
        } else if (!_s  || typeof _s !== "object") {
            return `'${key}' was invalid`;
        }

        _s.model = value;
        return _s.model;
    }

    /**
     * Creates Child Model
     * @param {string} key
     * @param {*} value
     * @param {MetaData} metaData
     * @returns {BaseModel|string} - PropertiesModel, ItemsModel or error string
     */
    createSchemaChild(key, value, metaData) {
        let path = !Array.isArray(this._ref.model) ?
            `${this._ref.path}/properties/${key}` : `${this._ref.path}/items`;
        // populates MetaData config object
        let _d = Object.assign({
            _path: path,
            _parent: this._ref,
            _root: this._ref.root,
            _owner: this._ref.owner,
        }, metaData || {});

        // constructs new MetaData object with owner as reference point for chaining
        let _md = new MetaData(this._ref, _d);

        // returns new child Model
        return new ((!Array.isArray(value)) ? PropertiesModel : ItemsModel)(_md);
    }
}
