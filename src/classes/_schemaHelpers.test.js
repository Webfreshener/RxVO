import {_mdRef} from "./_references";
import {PropertiesModel} from "./propertiesModel";
import {JSD} from "./jsd";
import {SchemaHelpers} from "./_schemaHelpers";
import {basicModel} from "../../fixtures/PropertiesModel.schemas";

describe("SchemaHelpers Class Tests", () => {
    let _jsd, _schema, _sH;

    beforeEach(() => {
        _jsd = new JSD(basicModel);
        _schema = new PropertiesModel(_jsd);
        _sH = new SchemaHelpers(_schema);
    });

    describe("Child Object Methods", () => {
        beforeEach(() => {
            _jsd = new JSD(basicModel);
            _schema = new PropertiesModel(_jsd);
            _sH = new SchemaHelpers(_schema);
        });

        it("should set PropertiesModel from Object values", () => {
            expect((typeof _sH.setObject({properties: {name: "bar"}})) === "string").toBe(false);
            expect(_schema.model.properties.name).toBe("bar");
        });

        describe("Create Object", () => {
            it("should create Child PropertiesModel Object", () => {
                let _sC = _sH.createSchemaChild("foo", {}, _mdRef.get(_schema));
                expect((typeof _sC) === "string").toBe(false);
                expect(_sC instanceof PropertiesModel).toBe(true);
            });
        });
        describe("ItemsModel Values", () => {
            it("should set Value Object on Child PropertiesModel", () => {
                const sH = new SchemaHelpers(_schema);
                const _child = sH.setChildObject("", {baz: 123});
                expect(typeof _child).toBe("object");
                expect(_child.baz).toBe(123);
            });
        });

    });
});
