/**
 *
 * Updated by uur on 12/01/16.
 */

"use strict";

const Async = require("async");
const Forklift = require("s3-forklift");
const FileUploader = require("./uploader/file_uploader");
const ImageUploader = require("./uploader/image_uploader");
const TraverseSchema = require("./traverse_schema");

/**
 * @param {Mongoose.Schema} schema
 * @param {{s3:{},Mongoose:Mongoose}} options
*/

module.exports = (schema, options) => {

    const s3 = options.s3;

    if (!s3) {
        console.log("Options passed to mechanic-mongoose does not contain s3 credentials.");
    }

    const forklift = new Forklift(s3);

    const instance = this;

    const attachments = {};
    attachments["images"] = TraverseSchema(schema, null, "Image", true);
    attachments["files"] = TraverseSchema(schema, null, "File", true);

    schema.pre("save", function(next) {

        const instance = this;

        const attachments = {};
        // Collect attachments,

        attachments["images"] = TraverseSchema(schema, instance, "Image", true);
        attachments["files"] = TraverseSchema(schema, instance, "File", true);

        Async.auto({

            "uploadFiles": (autoCallback) => {

                if (!attachments.files) {
                    return autoCallback();
                }
                FileUploader(forklift, attachments.files, autoCallback);
            },
            "uploadImages": (autoCallback) => {

                if (!attachments.images) {
                    return autoCallback();
                }
                FileUploader(forklift, attachments.images, autoCallback);
            }
        }, next);
    });
};
