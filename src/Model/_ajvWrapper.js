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
/**
 * @private
 */
import {_ajvRef} from "./_references";
import {Model} from "./index";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import {getSchemaID} from "./utils";

const _validators = new WeakMap();

/**
 * backreferences object tree for top-down evaluation
 * @param path
 * @param data
 * @param owner
 * @returns {any}
 * @private
 */
const _preconstruct = (path, data, owner) => {
    const _p = path.replace(/^[a-z0-9_]*#+/i, "").split("/");
    let _o = Object.assign({}, data);
    while(_p.length > 0) {
        _p.pop();
        try {
            _o = Object.assign({}, owner.getPath(_p.join(".")), _o);
        } catch (e) {
            _p.splice(0, _p.length-1);
            throw e;
        }
    }

    return _o;
};

/**
 *
 * @param inst
 * @param schemas
 * @param opts
 * @returns {ajv | ajv.Ajv}
 */
const createAjv = (inst, schemas, opts) => {
    const _ajv = new Ajv(opts);
    addFormats(_ajv);

    if (schemas) {
        if (schemas.hasOwnProperty("meta")) {
            if (Array.isArray(schemas.meta)) {
                schemas.meta.forEach((meta) => {
                    _ajv.addMetaSchema(meta);
                });
            }
        }

        // todo: review performance of addSchema
        if (schemas.hasOwnProperty("schemas")) {
            let schemaID;
            if (Array.isArray(schemas.schemas)) {
                schemas.schemas.forEach((schema) => {
                    schemaID = getSchemaID(schema);
                    _ajv.addSchema(schema, schemaID);
                });
            } else {
                if ((typeof schemas.schemas) === "string") {
                    schemaID = getSchemaID(schemas.schema);
                    _ajv.addSchema(schemas.schemas, schemaID);
                }
            }

            if (schemaID) {
                inst.path = schemaID;
            }
        }
    }

    return _ajv;
};

/**
 * Wrapper for Ajv JSON-PropertiesModel Validator
 * @private
 */
export class AjvWrapper {
    /**
     * @constructor
     * @param owner
     * @param schemas
     * @param ajvOptions
     */
    constructor(owner, schemas, ajvOptions = {}) {
        // ensures that we are given something that represents a Model object
        if ((!owner) || !(owner instanceof Model)) {
            throw "Model is required at arguments[0]";
        }

        if (_validators.get(this) === void(0)) {
            _validators.set(this, {});
        }

        // defines getter for parent Model reference
        Object.defineProperty(this, "$owner", {
            get: () => owner,
            enumerable: false,
        });

        // applies user specified options over our default Ajv Options
        const opts = Object.assign(_ajvOptions, ajvOptions);

        // makes user defined options object accessible for evaluation
        Object.defineProperty(this, "options", {
            get: () => opts,
            enumerable: true,
        });

        // declares default path of root# for validation queries
        this.path = "root#";

        // appends trailing "#" to end of "id" string if missing
        const _procID = (id) => id.match(/#+$/) === null ? `${id}#` : id;

        // processes schema "id" for JSON-schemas =< v04 and >= v06
        const _procSchema = (_s) => {
            if (_s.hasOwnProperty("$id")) {
                _s["$id"] = _procID(_s["$id"]);
            }

            if (_s.hasOwnProperty("id")) {
                _s["id"] = _procID(_s["id"]);
            }
            return _s;
        };

        // evaluates contents of schemas to normalize "id" attributes to have trailing "#"
        if ((typeof schemas) === "object") {
            if (schemas.hasOwnProperty("schemas")) {
                if (Array.isArray(schemas.schemas)) {
                    schemas.schemas = schemas.schemas.map(_procSchema);
                } else {
                    schemas.schemas = _procSchema(schemas.schemas);
                }
            } else {
                if (Array.isArray(schemas)) {
                    schemas = schemas.map(_procSchema);
                } else {
                    schemas = _procSchema(schemas);
                }
            }
        }

        const _ajv = createAjv(this, schemas, opts);

        // initializes Ajv instance for this Doc and stores it to WeakMap
        _ajvRef.set(this, _ajv);

        // accept no further modifications to this object
        Object.seal(this);
    }

    /**
     * Helper method to derive path for given model
     * todo: review for removal
     * @param model
     * @return {string}
     */
    static resolvePath(model) {
        return "not yet implemented";
    }

    /**
     * Getter for captive Ajv validator
     * -- use this for Ajv API Methods
     * @returns {ajv}
     */
    get $ajv() {
        return _ajvRef.get(this);
    }

    /**
     * Executes validator at PropertiesModel $model `path` against `value`
     * @param {string} path
     * @param {any} value
     */
    exec(path, value) {
        // appends id ref to path
        if (path.indexOf("#") < 0) {
            path = `${this.path}${path}`;
        }

        let _res = false;
        /*
            makes initial validation attempt and reattempts from top on failure
         */
        try {
            _res = this.$ajv.validate(path, value);
        } catch (e) {

            if (path.replace(/(items|properties)\/?/, "").split("/").length) {
                return this.exec(`${this.path}/`, _preconstruct(path, value, this.$owner));
            }

            throw(e);
        }

        return _res;
    }
}

/**
 * AJV Options Config in it's entirely for reference
 * only Model specific option changes are enabled
 * @type {*}
 * @private
 */
const _ajvOptions = {
    // strict mode options (NEW)
    strict: true,
    strictTypes: "log",
    strictTuples: "log",
    allowUnionTypes: true,
    allowMatchingProperties: false,
    validateFormats: true,
    // validation and reporting options:
    $data: false,
    allErrors: false,
    verbose: false,
    $comment: false,
    formats: {},
    keywords: [],
    schemas: {},
    logger: undefined,
    loadSchema: undefined, // function(uri: string): Promise {}
    // options to modify validated data:
    removeAdditional: false,
    useDefaults: false,
    coerceTypes: false,
    // advanced options:
    meta: true,
    validateSchema: true,
    addUsedSchema: true,
    inlineRefs: true,
    passContext: false,
    loopRequired: Infinity,
    loopEnum: Infinity, // NEW
    ownProperties: false,
    multipleOfPrecision: undefined,
    messages: true,
    code: {
        // NEW
        es5: false,
        lines: false,
        source: false,
        process: undefined, // (code: string) => string
        optimize: true,
    },
};
