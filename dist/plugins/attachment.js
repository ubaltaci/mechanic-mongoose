/**
 *
 * Updated by uur on 12/01/16.
 */

"use strict";

var Async = require("async");
var Forklift = require("s3-forklift");
var FileUploader = require("./uploader/file_uploader");
var ImageUploader = require("./uploader/image_uploader");
var TraverseSchema = require("./traverse_schema");

/**
 * @param {Mongoose.Schema} schema
 * @param {{s3:{},Mongoose:Mongoose}} options
*/

module.exports = function (schema, options) {

    var s3 = options.s3;

    if (!s3) {
        console.log("Options passed to mechanic-mongoose does not contain s3 credentials.");
    }

    var forklift = new Forklift(s3);

    var instance = undefined;

    var attachments = {};
    attachments["images"] = TraverseSchema(schema, null, "Image", true);
    attachments["files"] = TraverseSchema(schema, null, "File", true);

    schema.pre("save", function (next) {

        var instance = this;

        var attachments = {};
        // Collect attachments,

        attachments["images"] = TraverseSchema(schema, instance, "Image", true);
        attachments["files"] = TraverseSchema(schema, instance, "File", true);

        Async.auto({

            "uploadFiles": function uploadFiles(autoCallback) {

                if (!attachments.files) {
                    return autoCallback();
                }
                FileUploader(forklift, attachments.files, autoCallback);
            },
            "uploadImages": function uploadImages(autoCallback) {

                if (!attachments.images) {
                    return autoCallback();
                }
                FileUploader(forklift, attachments.images, autoCallback);
            }
        }, next);
    });
};
//# sourceMappingURL=attachment.js.map