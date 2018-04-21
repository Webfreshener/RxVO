import {_exists, _mdRef, _oBuilders} from "./_references";
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
        if (!_exists(_ref) || (typeof _ref) !== "object") {
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
        _oBuilders.get(this._ref.rxvo).create(_s);

        if (typeof _s === "string") {
            return _s;
        } else if (!_exists(_s) ||
            typeof _s !== "object") {
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
     * @returns {Model|string} - PropertiesModel, ItemsModel or error string
     */
    createSchemaChild(key, value, metaData) {
        let path = !Array.isArray(this._ref.model) ?
            `${this._ref.path}/properties/${key}` : `${this._ref.path}/items`;
        // populates MetaData config object
        let _d = Object.assign({
            _path: path,
            _parent: this._ref,
            _root: this._ref.root,
            _rxvo: this._ref.rxvo,
        }, metaData || {});

        // constructs new MetaData object with owner as reference point for chaining
        let _md = new MetaData(this._ref, _d);

        // returns new child Model
        return new ((!Array.isArray(value)) ? PropertiesModel : ItemsModel)(_md);
    }
}
