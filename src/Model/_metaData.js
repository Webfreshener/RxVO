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
import {_mdRef} from "./_references";
import {PropertiesModel} from "./propertiesModel";
import {ItemsModel} from "./itemsModel";
const _mData = new WeakMap();

/**
 * @private
 */
export class MetaData {
    /**
     * @constructor
     * @param {PropertiesModel|ItemsModel} _oRef -- Object Reference to item being described
     * @param {object} _data -- Initial Data {parent:PropertiesModel|ItemsModel}
     */
    constructor(_oRef, _data = {}) {
        let _cName = _oRef.constructor.name;
        if (this._createID == null) {
            let _id = 0;
            MetaData.prototype._createID = function () {
                if (this.__objID == null) {
                    _id = _id + 1;
                    this.__objID = `${_cName}${_id}`;
                }
                return this.__objID;
            };
        }

        _data = Object.assign({}, _data, {
            _id: this._createID(),
            _className: _cName,
            _created: Date.now()
        });

        _mData.set(this, _data);
        _mdRef.set(this, this);
    }

    /**
     * @param {string} key
     */
    get(key) {
        let __ = _mData.get(this);
        return __ && __.hasOwnProperty(key) ? __[key] : null;
    }

    /**
     * not implemented
     */
    set() {
        return this;
    }

    /**
     * UUID of element
     * @returns {string} Unique ObjectID
     */
    get objectID() {
        return this.get("_id");
    }

    /**
     * Root PropertiesModel element
     * @returns {PropertiesModel|Set}
     */
    get root() {
        return this.get("_root");
    }

    /**
     * Path to element
     * @returns {string}
     */
    get path() {
        return `${this.get("_path")}`;
    }

    /**
     * Owner Model document
     * @returns {Model}
     */
    get owner() {
        return this.get("_owner");
    }

    /**
     * Getter for parent model
     * @returns {string | null}
     */
    get parent() {
        return this.get("_parent");
    }

    /**
     * Provides representation of Model as JSON string
     * @return {string}
     */
    toString() {
        return JSON.stringify(_mData.get(this));
    }
}
