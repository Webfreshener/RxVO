import {Model} from "./index";
import {default as deepEqual} from "deep-equal";
import {
    stringsCollection,
    stringsMinMaxCollection,
    objectCollection, objectCollectionDefaults
} from "../../fixtures/ItemsModel.schemas";
import {BaseModel} from "./base-model";
import {basicCollection} from "../../fixtures/PropertiesModel.schemas";

describe("ItemsModel Class Suite", function () {

    describe("Simple ItemsModel Tests", () => {

        describe("LifeCycle: Instantiation", () => {
            let _owner;
            beforeEach(() => {
                _owner = new Model({schemas: [stringsCollection]});
            });

            it("should initialize a schema and a schema object", () => {
                expect(_owner.model.$model).toBeDefined();
                expect(_owner.model.$model instanceof BaseModel).toBe(true);
            });

            it("should not initialize a invalid schema and schema object", () => {
                let badSchema = Object.assign({}, stringsCollection, {
                    items: [{type: "INVALID"}],
                });
                expect(() => new Model({schemas: [badSchema]})).toThrow();
            });
        });

        describe("ItemsModel LifeCycle: Creation", () => {
            let _d, _owner;

            beforeEach(() => {
                _owner = new Model({schemas: [stringsCollection]});
            });

            it("should populate with valid data and make that data accessible", (done) => {
                _d = ["abc", "def", "ghi"];
                let _cnt = 0;
                _owner.subscribe({
                    next: (m) => {
                        _cnt++;
                        expect(deepEqual(_owner.model, _d)).toBe(true);
                    },
                    error: done,
                });

                setTimeout(() => {
                    expect(_cnt).toEqual(1);
                    done();
                }, 100);

                _owner.model = _d;
            });

            it("should reject invalid data and leave model pristine", () => {
                _d = [99, 100, 101];

                _owner.model = _d;
                expect(deepEqual(_owner.model, {})).toBe(true);
            });
        });
    });

    describe("Nested Elements Tests", () => {

        describe("LifeCycle: Instantiation", () => {
            let _owner;
            beforeEach(() => {
                _owner = new Model({schemas: [objectCollection]});
            });

            it("should initialize a valid schema and a schema object", () => {
                expect(_owner.model.$model).toBeDefined();
                expect(_owner.model.$model instanceof BaseModel).toBe(true);
                expect(_owner.model.$model).toBeDefined();
                expect(_owner.model.$model instanceof BaseModel).toBe(true);
            });
        });

        describe("ItemsModel LifeCycle: Nested Create", () => {
            let _d, _owner;
            beforeEach(() => {
                _owner = new Model({schemas: [objectCollection]});
            });

            it("should populate with valid data and make that data accessible", (done) => {
                _d = [{
                    name: "Item A",
                    value: 1,
                }, {
                    name: "Item B",
                }, {
                    name: "Item C",
                    value: 2,
                }];

                let _cnt = 0;

                _owner.subscribe({
                    next: (m) => {
                        _cnt++;
                    },
                    error: done,
                });

                setTimeout(() => {
                    expect(_cnt).toEqual(1);
                    done();
                }, 100);

                _owner.model = _d;
                // expect(deepEqual(_owner.model, _d)).toBe(true);
            });

            it("should reject invalid data and leave model pristine", () => {
                _d = [{
                    name: 123,
                    value: 1,
                }, {
                    value: "Item B",
                }, {
                    value: 2,
                }];

                _owner.model = _d;
                expect(typeof _owner.errors).toBe("object");
                expect(deepEqual(_owner.model, [])).toBe(true);
            });
        });

        describe("LifeCycle: Update", () => {

            let _d, _owner;
            beforeEach(() => {
                _owner = new Model({schemas: [objectCollection]});
            });

            it("should update nested models with valid data and pass validation", () => {
                _d = [{
                    name: "Item A",
                    value: 1,
                }, {
                    name: "Item B",
                }, {
                    name: "Item C",
                    value: 2,
                }];

                _owner.model = _d;

                _owner.model[1] = {
                    name: "Item B",
                    value: 3
                };

                expect(_owner.errors).toBe(null);
                expect(_owner.model[1]).toEqual({name: "Item B", value: 3});
            });

            it("should updated properties in nested objects with valid data and pass validation", () => {
                _d = [{
                    name: "Item A",
                    value: 1,
                }, {
                    name: "Item B",
                }, {
                    name: "Item C",
                    value: 2,
                }];

                _owner.model = _d;

                _owner.model[1].value = 3;


                expect(_owner.errors).toBe(null);
                expect(_owner.model[1]).toEqual({name: "Item B", value: 3});
            });
        });

        describe("LifeCycle: Delete", () => {
            let _owner;
            beforeEach(() => {
                _owner = new Model({schemas: [stringsCollection]});
            });

            let _d = ["Item A", "Item B", "Item C"];

            it("should allow deletion of nested properties that are not required", () => {
                _owner.model = _d;
                delete _owner.model[1];
                expect(_owner.errors).toBe(null);
                expect(_owner.model.length).toBe(2);
            });

            it("should prevent deletion of nested properties that are required", () => {
                _owner.model = _d;
                delete _owner.model[0];
                delete _owner.model[1];
                delete _owner.model[2];
                expect(typeof _owner.errors).toBe("object");
                expect(_owner.model.length).toBe(1);
            });
        });

        describe("LifeCycle: Reset", () => {
            let _owner;
            beforeEach(() => {
                _owner = new Model({schemas: [objectCollection]});
            });

            it("should notifiy subsequent validations", () => {
                const _d = [{
                    name: "Item A",
                    value: 1,
                }, {
                    name: "Item B",
                }, {
                    name: "Item C",
                    value: 2,
                }];

                _owner.model = _d;

                setTimeout(() => {
                    _owner.subscribe({
                        next: (m) => {
                            expect(m.models.length).toEqual(3);
                            done()
                        },
                        error: done,
                    });

                    _owner.model = _d;
                }, 100);
            });
        });


    });

    describe("Array Prototype method tests", () => {
        let _owner;
        beforeEach(() => {
            _owner = new Model({schemas: [stringsMinMaxCollection]});
            _owner.model = ["Item A", "Item B", "Item C"];
        });

        it("should fill with validation", () => {
            _owner.model.fill(["Item A", "Item B", "Item C", "Item D"]);
            expect(typeof _owner.errors).toBe("object");
            expect(_owner.model.length).toBe(3);
        });

        it("should pop with validation", () => {
            _owner.model.pop();
            _owner.model.pop();
            _owner.model.pop();
            expect(typeof _owner.errors).toBe("object");
            expect(_owner.model.length).toBe(1);
        });

        it("should push with validation", () => {
            _owner.model.push("Item D");
            expect(typeof _owner.errors).toBe("object");
            expect(_owner.model.length).toBe(3);
            expect(_owner.model[2]).toBe("Item C");
        });

        it("should shift with validation", () => {
            _owner.model.shift();
            _owner.model.shift();
            _owner.model.shift();
            expect(typeof _owner.errors).toBe("object");
            expect(_owner.model.length).toBe(1);
        });

        it("should splice with validation", () => {
            // remove all..
            _owner.model.splice(0, -1);
            expect(typeof _owner.errors).toBe("object");
            expect(_owner.model.length).toBe(3);
            // append element...
            _owner.model.splice(0, 0, "Item D");
            expect(typeof _owner.errors).toBe("object");
            expect(_owner.model.length).toBe(3);
        });

        it("should unshift with validation", () => {
            _owner.model.unshift("Item Z");
            expect(typeof _owner.errors).toBe("object");
            expect(_owner.model.length).toBe(3);
        });
    });

    describe("Default Values", () => {
        it("should apply defaults to items", () => {
            const _owner = new Model({schemas: [objectCollectionDefaults]}, {ajvOptions: {useDefaults: true}});
            _owner.model = [{}];
            expect(_owner.model[0]).toEqual({name: "abc"});
        });
    });

    describe("Model Class methods ", () => {
        let _owner;

        it("should not reset if it would invalidate model", () => {
            _owner = new Model({schemas: [stringsMinMaxCollection]});
            _owner.model = ["Item A", "Item B", "Item C"];
            expect(_owner.model.length).toBe(3);
            _owner.model.$model.reset();
            expect(_owner.model.length).toBe(3);
        });

        it("should reset its collection if allowed", () => {
            _owner = new Model({schemas: [stringsCollection]});
            _owner.model = ["Item A", "Item B", "Item C"];
            expect(_owner.model.length).toBe(3);
            _owner.model.$model.reset();
            expect(_owner.model.length).toBe(0);
        });

        it("should quietly validate data with the validate method", () => {
            _owner = new Model({schemas: [stringsCollection]});
            expect(_owner.model.$model.validate([1, 2, 3])).toBe("data/0 should be string");
            expect(_owner.model.$model.validate(["1", "2", "3"])).toBe(true);
        });

        it("should freeze its model", () => {
            _owner = new Model({schemas: [stringsCollection]});
            _owner.model = ["Item A", "Item B", "Item C"];
            _owner.model.$model.freeze();
            expect(_owner.model.$model.isFrozen).toBe(true);
            _owner.model = ["1", "2", "3"];
            expect(deepEqual(_owner.model, ["Item A", "Item B", "Item C"])).toBe(true);
        });

        it("should freeze its model hierarchy", () => {
            const _orig = [{
                name: "My Name",
                active: true,
            }];
            _owner = new Model({schemas: [basicCollection]});
            _owner.model = _orig;
            _owner.model.$model.freeze();

            expect(() => _owner.model[0].name = "Other Name")
                .toThrow("model path \"root#/items\" is non-configurable and non-writable");
        });
    });
});
