import {ObserverBuilder} from "./_observerBuilder";
import {Model} from "./index";
import {PropertiesModel} from "./propertiesModel";

describe("ObserverBuilder Unit Test Suite", () => {
    describe("Builder Methods", () => {
        let _observer = null;
        let _observerForModel = null;
        let _model = null;
        const _schema = {
            $id: "root#",
            type: "object",
            properties: {
                name: {
                    type: "string",
                },
                active: {
                    type: ["boolean", "number"],
                }
            },
        }

        beforeEach(function () {
            _observer = new ObserverBuilder();
            // try {
            //     _model = new Model({schemas: [_schema]});
            // } catch (e) {
            //     console.error(e);
            // }

            const _root = new Model({
                schemas: [_schema],
                //     [{
                //     $id: "root#",
                //     type: "object",
                //     properties: {
                //         testing: {
                //             type: "object",
                //             properties: _schema.properties,
                //         },
                //     },
                // }]
            });

            _model = new PropertiesModel(_root, "root#")

            _observerForModel = _observer.create(_model);
        });

        it("should create an observer", function () {
            expect(Object.keys(_observer.getObserverForModel(_model)))
                .toEqual(['onNext', 'onError', 'onComplete', 'path', 'jsonPath', 'targetId']);
        });

        it.skip("should subscribe to observer and get value", function (done) {
            const _data = {
                name: "item-A",
                active: true
            };

            const _f = {
                next: (o) => {
                    expect(`${o}`).toBe(JSON.stringify(_data));
                    done();
                },
                error: (e) => {
                    done(e);
                }
            };
            _model.subscribe(_f);
            _model.model = _data;
        });
    });
});
