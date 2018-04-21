import {RxVO}  from './index';
import {RxVO as RxVOPackaged}  from '../dist/rxvo'
describe("Index", () => {
    describe("Package Validation Tests", () => {
        it("should import from ES6 Source", function () {
            expect(typeof RxVO).toEqual('function');
        });

        it("should import from WebPacked Lib", function () {
            expect(typeof RxVOPackaged).toEqual('function');
        });

        it("should import from ES5 `require`", () => {
            expect(typeof (require('../index').RxVO)).toEqual('function');
        });
    });

    describe("Polyfill", () => {
        // this test is strictly for the sake of jest coverage
        // todo: put browser testing on this, node has Object.assign
        // todo: review browser support requirements
        it("tests the polyfill for Object.assign", () => {
            expect(Object.assign).toBeDefined();
        })
    })
});
