import {MetaData} from "./_metaData";
import {PropertiesModel} from "./propertiesModel";
import {Model} from "./index";
import {basicModel} from "../../fixtures/PropertiesModel.schemas";
describe("MetaData Units", () => {
    let _md = null;
    describe( "SubClass Validation", ()=> {
        it( "should accept objects that are subclasses of PropertiesModel", function() {
            let _ = new PropertiesModel(new Model(basicModel));
            !expect(() => _md = new MetaData(_, {_path: "", _root: _})).not.toThrow(
                "new MetaData() argument 1 requires subclass PropertiesModel or ItemsModel. Was subclass of '<Object>'");
        });
        it( "should accept objects that are subclasses of ItemsModel", function() {
            let _ = new Set();
            expect(()=> _md = new MetaData( _, { _path: "", _root: _})).not.toThrow(
                "new MetaData() argument 1 requires subclass PropertiesModel or ItemsModel. Was subclass of '<Object>'"
            );
        });
    });
    describe( "Parameter Accessor Validation", ()=> {
        const owner = new Model(basicModel);
        let _ = owner.model.$model;
        const _md = new MetaData( new PropertiesModel(owner), {_path: "key", _root: _, _parent: _});
        it("should access `root` property", function() {
            expect(typeof _md.root).toBe("object");
        });
        it("should access `path` property", function() {
            expect(_md.path).toEqual("key");
        });
        it("should access `parent` property", function() {
            let _md = new MetaData( _, { _path: "", _root: _});
            expect(typeof _md.parent).toEqual("object");
        });
    });
});
