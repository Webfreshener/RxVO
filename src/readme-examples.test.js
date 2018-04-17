import {JSD} from "./index";
import {ItemsModel} from "./classes/itemsModel";
import {PropertiesModel} from "./classes/propertiesModel";
import {_vBuilders} from "./classes/_references";

describe("README.md examples tests", () => {
    it("main PropertiesModel example should work", (done) => {
        const _schema = {
            "name": {
                "type": "String",
                "required": true
            },
            "age": {
                "type": "Number",
                "required": true
            }
        };
        const _handlers = {
            next: function (schema) {
                if (typeof schema !== "undefined") {
                    // outputs: {"name":"Frank","age":23}
                    expect(schema.model.name).toBe("Frank");
                    expect(schema.model.age).toBe(23);
                    done();
                }
            },
            error: function (e) {
                // error: 'age' expected number, type was '<string>'
                console.log(`error: ${e}`);
            }
        };
        const _jsd = new JSD(_schema);
        _jsd.model.$ref.subscribe(_handlers);
        // set invalid data to the model to trigger error handler
        _jsd.model = {
            "name": "Frank",
            "age": "23"
        };
        // set valid data to the model to trigger next handler
        _jsd.model = {
            "name": "Frank",
            "age": 23
        };
    });

    it("JSD Array example should work", (done) => {
        // we define an array that accepts objects comprised of a name string and numeric score
        const _schema = [{
            type: "Object",
            properties: {
                name: {
                    type: "String",
                    required: true,
                    restrict: "^[a-zA-Z0-9\\-\\s]{1,24}$"
                },
                score: {
                    type: "Number",
                    required: true
                },
            },
        }];

        const _handler = {
            next: (val) => {
                // outputs: {"values":[{"name":"Player 1","score":2000000},{"name":"Player 2","score":1100000},{"name":"Player 3","score":900000}]}
                console.log(`done: ${val}`);
                // expect(val.model[0].("$ref")).toBe(true);
                expect(val.model[0].$ref instanceof PropertiesModel).toBe(true);
                done();
            },
            error: (e) => {
                // error: 'score' expected number, type was '<string>'s
                done(e);
            }
        };

        const _jsd = new JSD(_schema);
        _jsd.model.$ref.subscribe(_handler);

        _jsd.model = [{
            name: "Player 1",
            score: 2000000,
        }, {
            name: "Player 2",
            score: 1100000
        }, {
            // this will error because score is a string value
            name: "BOGUS",
            score: "1100000"
        }, {
            name: "Player 3",
            score: 900000
        }];
    });

    it("JSD Boolean example should work", (done) => {
        const _schema = {
            value: {
                type: "Boolean",
                required: false,
                default: true,
            }
        };

        const _handler = {
            next: (val) => {
                // outputs: {"value":true}
                // outputs: {"value":true}
                // outputs: {"value":false}
                console.log(`${val}`);
                done();
            },
            error: (e) => {
                // error: 'value' expected boolean, type was '<string>'
                console.log(`error: ${e}`);
            }
        };


        const _jsd = new JSD(_schema);
        _jsd.model.$ref.subscribe(_handler);

        // - this will trigger the default value
        _jsd.model = {};

        // set value to true
        _jsd.model = {value: true};

        // set value to false
        _jsd.model = {value: false};

        // triggers error due to type mismatch
        _jsd.model = {value: "true"};
    });

    it("JSD Number example should work", (done) => {
        const _schema = {
            value: {
                type: "Number",
                required: true,
                // default: true,
            }
        };

        const _handler = {
            next: (val) => {
                // outputs: {"value":1234}
                console.log(`${val}`);
                done();
            },
            error: (e) => {
                // error: 'value' expected number, type was '<string>'
                console.log(`error: ${e}`);
            }
        };


        const _jsd = new JSD(_schema);
        _jsd.model.$ref.subscribe(_handler);

        // this fails because the value is a string
        _jsd.model = {value: "1234"};

        // this will succeed
        _jsd.model = {value: 1234};
    });

    it("JSD String example should work", (done) => {
        const _schema = {
            value: {
                type: "String",
                required: true,
                restrict: "^[a-zA-Z0-9_\\s\\-]+$"
            }
        };

        const _handler = {
            next: (val) => {
                // outputs: {"value":"false"}
                console.log(`${val}`);
                done();
            },
            error: (e) => {
                // error: 'value' expected string, type was '<boolean>'
                console.log(`error: ${e}`);
            }
        };


        const _jsd = new JSD(_schema);
        _jsd.model.$ref.subscribe(_handler);

        // this fails because type is boolean
        _jsd.model = {value: true};

        // this will succeeed
        _jsd.model = {value: "false"};
    });

    it("JSD Object example should work", (done) => {
        // we define an element named `value` that requires a name and optional active attributes
        const _schema = {
            value: {
                type: "Object",
                required: false,
                properties: {
                    name: {
                        type: "String",
                        required: true
                    },
                    active: {
                        type: "Boolean",
                        required: true,
                        default: false
                    }
                }
            }
        };

        const _handler = {
            next: (val) => {
                // outputs: {"value":{"name":"Alice","active":true}}
                // outputs: {"value":{"name":"Bob","active":false}}
                console.log(`${val}`);
                done();
            },
            error: (e) => {
                // error: 'value.active' expected boolean, type was '<number>'
                console.log(`error: ${e}`);
            }
        };

        const _jsd = new JSD(_schema);
        _jsd.model.$ref.subscribe(_handler);

        // this will error since `active` is a number
        _jsd.model = {
            value: {
                name: "Alice",
                active: 1,
            }
        };

        // this will pass
        _jsd.model = {
            value: {
                name: "Alice",
                active: true
            }
        };

        // this will also pass since `active` is optional
        _jsd.model = {
            value: {
                name: "Bob",
            }
        };
    });

    it("JSD Wildcard KEYS example should work", (done) => {
        // creates a schema that allows any key assignent, but value must be object
        const _schema = {
            "*": {
                type: "Object",
                extensible: true,
                properties: {
                    name: {
                        type: "String",
                        required: true,
                        restrict: "^[a-zA-Z0-9_\\s\\-]{9,}$"
                    },
                    score: {
                        type: "Number",
                        required: true,
                    }
                },
            }
        };

        const _handler = {
            next: (val) => {
                // {"1":{"name":"Big Daddy","score":2000000}, ...}
                console.log(`${val}`);
                _sub.unsubscribe();
                done()
            },
            error: (e) => {
                // error: 1 expected value of type 'Object'. Type was '<number>'
                console.log(`error: ${e}`);
            }
        };

        const _jsd = new JSD(_schema);
        const _sub = _jsd.model.$ref.subscribe(_handler);

        // this will fail because value is number, not an object
        _jsd.model = {
            1: 900000,
        };

        // this succeeds
        _jsd.model = {
            1: {
                name: "Big Daddy",
                score: 2000000
            },
            2: {
                name: "HeavyMetalPrincess",
                score: 1100000
            },
            3: {
                name: "Munga-Munga",
                score: 900000
            },
        };
        console.log(_jsd.model.$ref.validate());
    });

    it("JSD Wildcard TYPES example should work", (done) => {
        // creates a schema that lets key `value` be set to any scalar type (string, bool, number etc)
        const _schema = {
            value: {
                type: "*",
            }
        };

        const _handler = {
            next: (val) => {
                // outputs: {"value":900000}
                // outputs: {"value":"A string"}
                // outputs: {"value":false}
                console.log(`${val}`);
                _sub.unsubscribe();
                done()
            },
            error: (e) => {
                // error: element 'bogus' is not a valid element
                console.log(`error: ${e}`);
            }
        };

        const _jsd = new JSD(_schema);
        const _sub = _jsd.model.$ref.subscribe(_handler);

        // any model with the key named `value` is ok
        _jsd.model = {
            value: 900000,
        };

        // any model with the key named `value` is ok
        _jsd.model = {
            value: "A string",
        };

        // any model with the key named `value` is ok
        _jsd.model = {
            value: false,
        };

        // this will fail because key `bogus` is not allowed
        _jsd.model = {
            bogus: "false",
        };
    });

});