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
    _oBuilders, _validators, _dirtyModels, _schemaSignatures
} from "./_references";
import {ObserverBuilder} from "./_observerBuilder";
import {PropertiesModel} from "./propertiesModel";
import {ItemsModel} from "./itemsModel";
import {AjvWrapper} from "./_ajvWrapper";
import Notifiers from "./_branchNotifier";
import {walkObject} from "./utils";

const _documents = new WeakMap();
/**
 * returns Items or Properties model class based on type of expected property
 * @param el
 * @returns {ItemsModel|PropertiesModel|Function}
 * @private
 */
const _getModelClass = (el) => {
    let _class = PropertiesModel;

    if ((el.hasOwnProperty("type") && el["type"] === "array") ||
        (el.hasOwnProperty("items") && Array.isArray(el["items"]))) {
        _class = ItemsModel;
    }

    return _class;
};

/**
 * RxVo Model Entry-point
 * @public
 */
export class Model {
    /**
     * @constructor
     * @param {json} schemas
     * @param {object} options
     */
    constructor(schemas, options = {}) {
        // attempts to get user passes Avj options
        let ajvOptions = options.hasOwnProperty("ajvOptions") ?
            options["ajvOptions"] : null;

        // defines AjvWrapper instance for this Document and it's Schemas
        const _ajv = new AjvWrapper(this, schemas, ajvOptions);

        // sets AjvWrapper instance on map for use
        _validators.set(this, _ajv);

        // throws error if error message returned
        if (!_ajv.$ajv.validateSchema({schemas: schemas["schemas"]}, false)) {
            throw _ajv.$ajv.errors;
        }

        _schemaSignatures.set(this, schemas);
        _oBuilders.set(this, new ObserverBuilder());

        const _schema = schemas.hasOwnProperty("schemas") ?
            schemas.schemas[schemas.schemas.length - 1] : schemas;

        const _doc = new (_getModelClass(_schema))(this, _schema.$id || "root#");

        // creates holder for dirty model flags in this scope
        _dirtyModels.set(this, {});

        // applies Subject Handlers to root document
        _oBuilders.get(this).create(_doc);

        // sets document to this scope
        _documents.set(this, _doc);

        // creates RxJS Notification Delegate
        Notifiers.create(this);
    }

    /**
     * Adds Schema to Validator instance
     * @param schema
     * @returns {boolean}
     */
    addSchema(schema) {
        _validators.get(this).$ajv.addSchema(schema);
        return (_validators.get(this).$ajv.errors === null);
    }

    /**
     * Selects schema to validate against (advanced option, use wisely)
     * @param id
     */
    useSchema(id) {
        _validators.get(this).$ajv.getSchema(id);
    }

    /**
     * Getter for root Model
     * @returns {object|array}
     */
    get model() {
        return _documents.get(this).model;
    }

    /**
     * Setter for root Model value
     * @param {object|array} value
     */
    set model(value) {
        _documents.get(this).model = value;
    }

    /**
     * Getter for document's JSON-Schema
     * @return {any}
     */
    get schema() {
        const _id = _validators.get(this).path;
        return this.getSchemaForKey(_id);
    }

    /**
     * Freezes document object
     * @returns {Model}
     */
    freeze() {
        _documents.get(this).freeze();
        return this;
    }

    /**
     * Returns true if object is frozen
     * @returns {boolean}
     */
    get isFrozen() {
        return _documents.get(this).isFrozen;
    }

    /**
     * returns schema with given id
     * @param id
     * @returns {*}
     */
    getSchemaForKey(id) {
        let _schema = null;
        const _schemas = _schemaSignatures.get(this);
        _schemas.schemas.some((schema) => {
            if (schema.hasOwnProperty("$id")) {
                if (schema.$id === id) {
                    _schema = schema;
                    return true;
                }
            } else if (schema.hasOwnProperty("id")) {
                if (schema.id === id) {
                    _schema = schema;
                    return true;
                }
            }
            return false;
        });
        return _schema;
    }

    /**
     * Retrieves JSON-Schema element for given Path
     * @param path
     * @returns {any}
     */
    getSchemaForPath(path) {
        let _id;
        if (path.indexOf("#") > -1) {
            const _sp = path.split("#");
            _id = _sp[0];
            path = _sp[1];
        } else {
            _id = _validators.get(this).path;
        }

        const _schema = this.getSchemaForKey(_id);

        return walkObject(path, _schema);
    }

    /**
     * Validates data against named schema
     * @param path
     * @param value
     * @return {*|void|RegExpExecArray}
     */
    validate(path, value) {
        return _validators.get(this).exec(path, value);
    }

    /**
     * Getter for Ajv validation error messages
     * @return {error[] | null}
     */
    get errors() {
        return _validators.get(this).$ajv.errors || null;
    }

    /**
     *
     * @param to
     * @returns {Object|Array}
     */
    getPath(to) {
        let _ref = this.model;
        to = to.replace(/\/?(properties|items)+\//g, ".").replace(/^\./, "");
        (to.split(".")).forEach((step) => {
            if (_ref[step]) {
                _ref = _ref[step];
            }
        });

        return _ref;
    }

    /**
     * Retrieves all Models at given path
     * @param to
     * @returns {Array[]|Object[]}
     */
    getModelsInPath(to) {
        const _steps = [this.model];
        let _ref = this.model;
        to = to.replace(/\/?(properties|items)+\/?/g, ".");
        (to.split(".")
            .filter((itm, idx, arr) => arr.indexOf(itm) > -1))
            .forEach((step) => {
                if (_ref[step]) {
                    _steps[_steps.length] = _ref = _ref[step];
                }
            });
        return _steps;
    }


    /**
     *
     * @param pipesOrSchemas
     * @returns {Pipe}
     */
    pipeline(...pipesOrSchemas) {
        return _documents.get(this).pipeline(...pipesOrSchemas);
    }


    /**
     * Subscribes observer to root Model
     * @param observer
     * @returns {Observable}
     */
    subscribe(observer) {
        return _documents.get(this).subscribe(observer);
    }

    /**
     * Subscribes observer to Model at path
     * @param path
     * @param observer
     * @returns {Observable}
     */
    subscribeTo(path, observer) {
        return _documents.get(this).subscribeTo(path, observer);
    }

    /**
     * Implements toString
     * @return {string}
     */
    toString() {
        return `${this.model.$model}`;
    }

    /**
     * Implements toJSON
     * @return {*}
     */
    toJSON() {
        return this.model.$model.toJSON();
    }

    /**
     * Creates new PropertiesModel from JSON data
     * @param {string|json} json -- JSON Object or String
     * @param {object} options - Model options object
     * @returns {Model}
     */
    static fromJSON(json, options) {
        // quick peek at json param to ensure it looks ok
        const __ = (typeof json).match(/^(string|object)+$/);

        if (__) {
            // attempts to create Model from JSON or JSON string
            return new Model((__[1] === "string") ?
                JSON.parse(json) : json, options);
        }

        // throws error if something didn't look right with the json param
        throw new Error("json must be either JSON formatted string or object");
    }
}
