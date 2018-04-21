import {
    _object, _schemaHelpers, _oBuilders
} from "./_references";
import {Model} from "./model";
import {SchemaHelpers} from "./_schemaHelpers";
import {makeClean, makeDirty, refAtKeyValidation, refValidation} from "./utils";
import Notifier from "./_branchNotifier";

const _observerDelegates = new WeakMap();

/**
 * @class ItemsModel
 */
export class ItemsModel extends Model {
    /**
     * @constructor
     */
    constructor() {
        super(arguments[0]);
        _schemaHelpers.set(this, new SchemaHelpers(this));
        _object.set(this, new Proxy(Model.createRef(this, []), this.handler));
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
        if (!Array.isArray(value) || this.isFrozen) {
            return false;
        }

        if (refValidation(this, value) !== true) {
            console.log(`error! this.jsd.errors: ${JSON.stringify(this.jsd.errors)}`);
            Notifier.getInstance().sendError(this.jsonPath, this.jsd.errors);
            return false;
        }

        if (!this.isDirty) {
            // marks model as dirty to prevent cascading validation calls
            makeDirty(this);
        }

        _object.set(this, new Proxy(Model.createRef(this, []), this.handler));
        _observerDelegates.set(this, true);

        try {
            let cnt = 0;

            value.forEach((val) => {
                _object.get(this)[cnt++] = val;
            });

        } catch (e) {
            makeClean(this);
            console.log(e);
            (Notifier.getInstance().sendError.bind(this))(this.jsonPath, e);
            return false;
        }

        makeClean(this);
        Notifier.getInstance().sendNext(this.jsonPath);
        _observerDelegates.delete(this);

        return true;
    }

    get handler() {
        const _updateSelf = (value) => {
            this.model = value;
        };
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
                    const _self = this;
                    // only handle methods that modify the reference array
                    if (["fill", "pop", "push", "shift", "splice", "unshift"].indexOf(idx) > -1) {
                        // returns closure analog to referenced method
                        return (...args) => {
                            // mocks current model state
                            const _arr = [].concat(t);

                            // applies method to model state
                            const _val = t[idx].apply(_arr, args);

                            // validates updated mock
                            const _res = refValidation(_self, _arr);

                            // in event of validation failure
                            if (_res !== true) {
                                // .. marks model as clean
                                makeClean(_self);

                                // .. sends notifications
                                Notifier.getInstance().sendError(_self.jsonPath,
                                    _self.jsd.errors);

                                return false;
                            }

                            // this is a kludge to handle updates from proto methods
                            if (this.parent !== null) {
                                this.parent.model[this.jsonPath.split(".").pop()] = _arr;
                            } else {
                                this.jsd.model = _arr;
                            }

                            return _val;
                        }
                    } else {
                        return t[idx];
                    }
                }

                if (idx === "$ref") {
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
                    return false;
                }

                let _oDel = _observerDelegates.get(this);

                if (refAtKeyValidation(this, "items", value) !== true) {
                    if (_oDel !== void(0)) {
                        makeClean(this);
                        Notifier.getInstance().sendError(this.jsonPath, this.jsd.errors);
                    }
                    return false;
                }

                // we set the value on the array with success
                if ((typeof value) === "object") {
                    let _sH = _schemaHelpers.get(this);
                    value = _sH.setChildObject(`${this.path}`, value);
                }

                t[idx] = value;

                // makes clean if not serial operation
                if (_oDel !== void(0)) {
                    makeClean(this);
                    // updates observers
                    Notifier.getInstance().sendNext(this.jsonPath);
                }

                return true;
            },

            deleteProperty: (t, idx) => {
                let _oDel = _observerDelegates.get(this);
                // creates mock of future Model state for evaluation
                let _o = [].concat(t);
                try {
                    // attempts splice method to
                    // remove item at given index index
                    _o.splice(idx, 1);
                } catch (e) {
                    if (!_oDel) {
                        makeClean(this);
                        Notifier.getInstance().sendError(this.jsonPath, e);
                    }
                    return false;
                }

                // validates mock of change state
                const _res = refValidation(this, _o);


                if (_res !== true) {
                    // makes clean and notifies
                    // if not serial operation
                    if (!_oDel) {
                        makeClean(this);
                        Notifier.getInstance().sendError(this.jsonPath, _res);
                    }
                    return false;
                }

                // applies operation
                t.splice(idx, 1);

                // flags model as in sync with tree
                makeClean(this);

                // updates observers
                Notifier.getInstance().sendNext(this.jsonPath);
                return true;
            }
        });
    }
}
