"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Slug = require("speakingurl");
var Async = require("async");
var ShortId = require("shortid");

/**
 *
 * @param schema
 * @param options
 */
module.exports = function (schema, options) {

    var mongoose = options.mongoose;
    var modelItems = Object.keys(schema.tree);
    var slugItems = [];

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = modelItems[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var modelItem = _step.value;

            /**
             * test_title: String
             * olamaz, propertylerinde slug: "slug_key" olması lazım.
             *
             * test_title: {
             *    type: String,
             *    slug: "test_slug"
             * }
             *
             */

            if (schema.tree[modelItem].slug && (schema.tree[modelItem].type == String || schema.tree[modelItem].type == mongoose.Schema.Types["String"])) {

                var referenceKey = schema.tree[modelItem].slug;
                if (schema.tree[referenceKey]) {
                    throw new Error("Ref: " + referenceKey + " in slug is used in another key.");
                }

                schema.add(_defineProperty({}, referenceKey, {
                    type: String,
                    unique: true,
                    lowercase: true,
                    trim: true
                }));

                slugItems.push({
                    main: modelItem,
                    slug: referenceKey
                });
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    schema.pre("save", function (next) {

        var instance = this;

        Async.each(slugItems, function (slugItem, eachCallback) {

            if (!instance.isModified(slugItem.main)) {
                return eachCallback();
            }
            return _createSlug(instance, slugItem, eachCallback);
        }, function (error) {
            if (error) {
                return next(error);
            }
            return next();
        });
    });
};

function _createSlug(instance, slugItem, callback) {

    var slugValue = Slug(instance[slugItem.main]);

    instance.constructor.findOne(_defineProperty({}, slugItem.slug, slugValue), function (error, collapsedInstance) {

        if (error) {
            return callback(error);
        }

        console.log(collapsedInstance);
        console.log("------");
        if (collapsedInstance) {
            console.log(collapsedInstance._id.toString() != instance._id.toString());
        }

        if (collapsedInstance && collapsedInstance._id.toString() != instance._id.toString()) {
            console.log("1 collapsed");
            instance[slugItem.slug] = slugValue + "-" + ShortId.generate();
            return callback();
        }

        instance[slugItem.slug] = slugValue;
        return callback();
    });
}
//# sourceMappingURL=slug.js.map