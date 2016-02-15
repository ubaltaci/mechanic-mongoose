/**
 * Check attachments uploaded with multipart-form.
 */
"use strict";

var Mongoose = require("mongoose");

module.exports = function (payload, instance, schema, errors) {

    var isUpdate = false;
    if (instance) {
        // update operation
        isUpdate = true;
    }

    Object.keys(schema.tree).forEach(function (key) {

        var schemaItem = schema.tree[key];

        if (schemaItem.type == Mongoose.SchemaTypes.Image || schemaItem.type == Mongoose.SchemaTypes.File) {

            var isRequired = schemaItem.required;

            if (!payload[key]) {
                // skip fot not included record keys
            }
            if (!payload[key].filename || !payload[key].path) {

                if (isRequired && !isUpdate) {
                    errors.push({
                        key: key,
                        msg: "can not be blank."
                    });
                } else if (isRequired && isUpdate && !instance[key]) {
                    errors.push({
                        key: key,
                        msg: "can not be blank."
                    });
                }
                delete payload[key];
            } else {
                if (schemaItem.type == Mongoose.SchemaTypes.Image) {

                    var contentTypes = payload[key]["headers"]["content-type"].split("/");
                    if (contentTypes[0] != "image") {
                        delete payload[key];
                        errors.push({
                            key: key,
                            msg: "uploaded file not an image."
                        });
                    } else if (["jpg", "jpeg", "png"].indexOf(contentTypes[1].toLocaleLowerCase()) == -1) {
                        delete payload[key];
                        errors.push({
                            key: key,
                            msg: "uploaded file not a valid image, expected: jpg or png."
                        });
                    }
                }
                if (schemaItem.type == Mongoose.SchemaTypes.File) {

                    var filenameParts = payload[key].filename.split(".");
                    var ext = filenameParts.pop();

                    var expected = schemaItem.extension;
                    if (!(schemaItem.extension instanceof Array)) {
                        expected = [expected];
                    }

                    if (expected.indexOf(ext) == -1) {
                        delete payload[key];
                        errors.push({
                            key: key,
                            msg: "uploaded file has wrong type, expected: " + schemaItem.kind
                        });
                    }
                }
            }
        }
    });
};
//# sourceMappingURL=check_attachments.js.map