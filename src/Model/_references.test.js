import each from "jest-each";
import {
    _validators, _schemaHelpers,
    _mdRef, _object,
    _observers, _oBuilders,
    _dirtyModels,
    _schemaSignatures
} from "./_references";

describe("Maps Units", () => {

    describe("Shared WeakMap Reference Holders", () => {
        each([
            [_validators, WeakMap, true],
            [_schemaHelpers, WeakMap, true],
            [_mdRef, WeakMap, true],
            [_object, WeakMap, true],
            [_observers, WeakMap, true],
            [_oBuilders, WeakMap, true],
            [_schemaSignatures, WeakMap, true],
            [_dirtyModels, WeakMap, true],
        ])
            .it("expects %s to be a Weakmap", (a, b, expected) => {
                expect(a instanceof b).toBe(expected);
            });
    });
});
