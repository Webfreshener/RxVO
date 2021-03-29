/* ############################################################################
The MIT License (MIT)

Copyright (c) 2016 - 2019 Van Schroeder
Copyright (c) 2017-2019 Webfreshener, LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

############################################################################ */

/**
 * Holder for PropertiesModel and ItemsModel instance references
 *
 * @type {WeakMap}
 * @private
 */
export const _object = new WeakMap();

/**
 * Holder for MetaData references
 * @type {WeakMap}
 * @private
 */
export const _mdRef = new WeakMap();

/**
 * Holder for AjvWrapper references
 * @type {WeakMap<Object, ajv>}
 * @private
 */
export const _ajvRef = new WeakMap();

/**
 * Holder for models in transition
 *
 * @type {WeakMap}
 * @private
 */
export const _dirtyModels = new WeakMap();

/**
 * Holder for PropertiesModel Validators
 * @type {WeakMap}
 * @private
 */
export const _validators = new WeakMap();

/**
 * Holder for PropertiesModel options refeerences
 *
 * @type {WeakMap}
 * @private
 */
export const _schemaOptions = new WeakMap();

/**
 * Holder for PropertiesModel Helpers references
 *
 * @type {WeakMap}
 * @private
 */
export const _schemaHelpers = new WeakMap();

/**
 * Holder for RXJS Observer references
 * @type {WeakMap}
 * @private
 */
export const _observers = new WeakMap();

/**
 * Holder for RXJS Observer references
 * @type {WeakMap}
 * @private
 */
export const _observerPaths = new WeakMap();

/**
 * Holder for Observer Builders
 * @type {WeakMap}
 * @private
 */
export const _oBuilders = new WeakMap();

/**
 * Holder for JSON-Schemas
 * @type {WeakMap}
 * @private
 */
export const _schemaSignatures = new WeakMap();
