/**
 * Check attachments uploaded with multipart-form.
 */

"use strict";

module.exports = function (mongoose, payload, instance, schema, errors) {

    var isUpdate = !!instance;

    var schemaKeys = Object.keys(schema.tree);

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = schemaKeys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var key = _step.value;

            var schemaItem = schema.tree[key];

            if (!schemaItem.type) {
                continue;
            }

            if (schemaItem.type != mongoose.Schema.Types.Image && schemaItem.type != mongoose.Schema.Types.File) {
                continue;
            }

            var isRequired = schemaItem.required;
            var itemPayload = payload[key] && payload[key].filename;

            if (!itemPayload) {
                // filename/payload empty!

                delete payload[key];

                if (isRequired && !isUpdate || isRequired && isUpdate && !instance[key]) {
                    errors.push({
                        key: key,
                        msg: "can not be blank."
                    });
                }
            } else {
                // filename/payload exist

                try {
                    var ext = payload[key].filename.split(".")[1];

                    if (schemaItem.type == mongoose.Schema.Types.Image && ["jpg", "jpeg", "png"].indexOf(ext.toLocaleLowerCase()) == -1) {

                        delete payload[key];
                        errors.push({
                            key: key,
                            msg: "uploaded file not a valid image, expected: jpg or png."
                        });
                    }
                    if (schemaItem.type == mongoose.Schema.Types.File) {

                        var expected = schemaItem.extension;

                        if (!expected) {
                            continue;
                        }

                        if (!(schemaItem.extension instanceof Array)) {
                            expected = [expected];
                        }
                        if (expected.indexOf(ext) == -1) {

                            delete payload[key];

                            errors.push({
                                key: key,
                                msg: "uploaded file has wrong type, expected: " + expected.join(",")
                            });
                        }
                    }
                } catch (e) {

                    delete payload[key];
                    errors.push({
                        key: key,
                        msg: "not a valid file"
                    });
                }
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
};
//# sourceMappingURL=check_attachments.js.map