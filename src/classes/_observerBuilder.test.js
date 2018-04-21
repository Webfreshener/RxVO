import {ObserverBuilder} from "./_observerBuilder";
import {RxVO} from "./rxvo";
import {PropertiesModel} from "./propertiesModel";

describe("ObserverBuilder Unit Test Suite", () => {
    describe("Builder Methods", () => {
        let _observer = null;
        let _schema = null;

        beforeEach(function () {
            _observer = null;
            _schema = new PropertiesModel({
                name: {
                    required: true,
                    type: "String",
                },
                active: {
                    required: true,
                    polymorphic: [{type: "Boolean"}, {type: "Number"}],
                }
            }, null, new RxVO());
        });

        it.skip("should create an observer", function () {
            ObserverBuilder.create("active", _schema);
            _observer = ObserverBuilder.getInstance().get("active");
            expect(typeof _observer.subscribe).toEqual("function");
        });

        it.skip("should subscribe to observer and get value", function (done) {
            const _f = {
                next: (o) => {
                    expect(o).toBe(true);
                    done();
                },
                error: (e) => {
                    done(e);
                }
            };
            _schema.subscribeTo("active", _f);
            _schema.model = {
                name: "item-A",
                active: true
            };
        });
    });
});