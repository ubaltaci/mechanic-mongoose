/**
 * Check attachments uploaded with multipart-form.
 */

"use strict";

module.exports = function (mongoose, payload, instance, schema, errors) {

    const isUpdate = !!instance;

    const schemaKeys = Object.keys(schema.tree);

    for (let key of schemaKeys) {

        const schemaItem = schema.tree[key];

        if (!schemaItem.type) {
            continue;
        }

        if (schemaItem.type !== mongoose.Schema.Types.Image
            && schemaItem.type !== mongoose.Schema.Types.File) {
            continue;
        }

        const isRequired = schemaItem.required;
        const itemPayload = payload[key] && payload[key].filename;

        if (!itemPayload) { // filename/payload empty!

            delete payload[key];

            if ((isRequired && !isUpdate) || (isRequired && isUpdate && !instance[key])) {
                errors.push({
                    key: key,
                    msg: "can not be blank."
                });
            }
        }
        else { // filename/payload exist

            try {
                const ext = payload[key].filename.split(".").pop();

                if (schemaItem.type === mongoose.Schema.Types.Image && ["jpg", "jpeg", "png"].indexOf(ext.toLocaleLowerCase()) === -1) {

                    delete payload[key];
                    errors.push({
                        key: key,
                        msg: "uploaded file not a valid image, expected: jpg or png."
                    });
                }
                if (schemaItem.type === mongoose.Schema.Types.File) {

                    let expected = schemaItem.extension;

                    if (!expected) {
                        continue;
                    }

                    if (!(schemaItem.extension instanceof Array)) {
                        expected = [expected];
                    }
                    if (expected.indexOf(ext) === -1) {

                        delete payload[key];

                        errors.push({
                            key: key,
                            msg: `Uploaded file has wrong type, expected: ${expected.join(",")}`
                        });
                    }
                }
            }
            catch (e) {

                delete payload[key];
                errors.push({
                    key: key,
                    msg: "not a valid file"
                });
            }
        }
    }
};
