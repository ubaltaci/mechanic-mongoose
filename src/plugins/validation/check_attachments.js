/**
 * Check attachments uploaded with multipart-form.
 */

"use strict";

const Mongoose = require("mongoose");

module.exports = function (payload, instance, schema, errors) {

    let isUpdate = false;
    if (instance) { // update operation
        isUpdate = true;
    }

    const schemaKeys = Object.keys(schema.tree);

    for (let key of schemaKeys) {

        const schemaItem = schema.tree[key];

        if (schemaItem.type == Mongoose.SchemaTypes.Image
            || schemaItem.type == Mongoose.SchemaTypes.File) {

            const isRequired = schemaItem.required;

            if (!payload[key]) {
                // skip fot not included record keys
                continue;
            }
            if (!payload[key].filename || !payload[key].path) {

                if (isRequired && !isUpdate) {
                    errors.push({
                        key: key,
                        msg: "can not be blank."
                    });
                }
                else if (isRequired && isUpdate && !instance[key]) {
                    errors.push({
                        key: key,
                        msg: "can not be blank."
                    });
                }
                delete payload[key];
            }
            else {
                if (schemaItem.type == Mongoose.SchemaTypes.Image) {

                    const contentTypes = payload[key]["headers"]["content-type"].split("/");
                    if (contentTypes[0] != "image") {
                        delete payload[key];
                        errors.push({
                            key: key,
                            msg: "uploaded file not an image."
                        });
                    }
                    else if (["jpg", "jpeg", "png"].indexOf(contentTypes[1].toLocaleLowerCase()) == -1) {
                        delete payload[key];
                        errors.push({
                            key: key,
                            msg: "uploaded file not a valid image, expected: jpg or png."
                        });
                    }
                }
                if (schemaItem.type == Mongoose.SchemaTypes.File) {

                    const filenameParts = payload[key].filename.split(".");
                    const ext = filenameParts.pop();

                    let expected = schemaItem.extension;
                    if (!(schemaItem.extension instanceof Array)) {
                        expected = [expected];
                    }

                    if (expected.indexOf(ext) == -1) {
                        delete payload[key];

                        const expected = schemaItem.kind ? (Array.isArray(schemaItem.kind) ? schemaItem.kind.join(", ") : schemaItem.kind) : "";

                        errors.push({
                            key: key,
                            msg: "uploaded file has wrong type, expected: " + expected
                        });
                    }
                }
            }
        }
    }
};