import {Model} from "./index";
import {basicCollection} from "../../fixtures/PropertiesModel.schemas";
import {default as data} from "../../fixtures/pipes-test.data";

describe("Pipes tests", () => {
    describe("basic implementation", () => {
        let _p;
        let _vo;

        beforeEach(() => {
            _vo = new Model({schemas: [basicCollection]});
            _p = _vo.pipeline(
                [(itm) => itm.active ? itm : undefined],
                basicCollection,
            );
        });

        it("should provide a pipeline", (done) => {
            // subscribe to pipeline
            const _sub = _p.subscribe({
                next: (d) => {
                    _sub.unsubscribe();
                    // data in VO as been filtered by Pipeline
                    expect(d.length).toEqual(3);
                    done();
                },
                error: (e) => {
                    _sub.unsubscribe();
                    done(e);
                }
            });
            // -- write to VO
            _vo.model = data;
        });
    });

    describe("nested pipes", () => {
        let _p, _vo;
        beforeEach(() => {
            _vo = new Model({
                schemas: [
                    {
                        type: "object",
                        properties: {
                            setA: Object.assign({}, basicCollection, {$id: "rootA#"}),
                            setB: Object.assign({}, basicCollection, {$id: "rootB#"}),
                        }
                    },
                ]
            });

            _vo.model = {
                setA: [],
                setB: [],
            };

            _p = _vo.model.setA.$model.pipeline(
                [(itm) => {
                    return itm;
                }],
                // basicCollection,
            );
        });

        it("should provide a discrete pipeline on a given element", (done) => {
            // subscribe to pipeline
            const _sub = _p.subscribe({
                next: (d) => {
                    _sub.unsubscribe();
                    // data in VO as been filtered by Pipeline
                    expect(d.length).toEqual(3);
                    done("should not be called");
                },
                error: (e) => {
                    _sub.unsubscribe();
                    done(e);
                }
            });

            // -- write to VO
            _vo.model.setB = data;
            setTimeout(() => {
                done();
            }, 100);
        });

        it("should only receive on a given element", (done) => {
            // subscribe to pipeline
            const _sub = _p.subscribe({
                next: (d) => {
                    _sub.unsubscribe();
                    // data in VO as been filtered by Pipeline
                    expect(d).toEqual(data.slice(0,3));
                    done();
                },
                error: (e) => {
                    _sub.unsubscribe();
                    done(e);
                }
            });

            // -- write to model sub-elements
            _vo.model.setB = [data[0]];
            _vo.model.setA = data.slice(0,3);
        });
    });

});
