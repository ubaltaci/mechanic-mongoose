/**
 *
 * Updated by uur on 12/01/16.
 */

"use strict";

const Async = require("async");
const Forklift = require("s3-forklift");
const FileUploader = require("./uploader/file_uploader");
const ImageUploader = require("./uploader/image_uploader");
const CheckAttachments = require("./validation/check_attachments");

/**
 * @param schema
 * @param options
 */

module.exports = (schema, options) => {

    const mongoose = options.mongoose;
    const s3 = options.s3;

    if (!s3 || !mongoose) {
        console.log("Options passed to mechanic-mongoose does not contain s3 credentials.");
    }

    schema.statics.checkAttachments = (payload, instance, schema, errors) => {

        CheckAttachments(mongoose, payload, instance, schema, errors);
        return errors;
    };


    const schemaItems = Object.keys(schema.tree);

    const attachments = {
        images: [],
        files: []
    };

    for (let schemaItem of schemaItems) {

        /**
         *
         * test_image: {
         *    type: mongoose.Schema.Types.Image,
         *    versions: {
         *       main: {
         *           size: "1920x1080",
         *           resize: ">",
         *           output: "jpeg"
         *       },
         *       display2: "960x",
         *       display3: "x960"
         *     }
         * }
         *
         *    available resize options: <,!,>
         *    available outputs: "jpeg", "jpg", "png"
         *
         *
         *
         * test_file {
         *    type: mongoose.Schema.Types.File,
         *    extension: ["pdf"]
         * }
         *
         *
         */

        if (schema.tree[schemaItem].type == mongoose.Schema.Types["Image"]) {

            const versions = schema.tree[schemaItem]["versions"] || {};

            if (typeof versions === "string" || versions instanceof String) {

                attachments.images.push({
                    schemaKey: schemaItem,
                    versions: [
                        {["main"]: _transformImageDesc(versions, schemaItem)}
                    ]
                });
                continue;
            }

            const versionKeys = Object.keys(versions);
            if (versionKeys.indexOf("original") != -1) {
                throw new Error(`${schemaItem} contains 'original' key which do not valid.`);
            }

            const images = [];
            for (let versionKey of versionKeys) {

                if (versionKey == "type") {
                    continue;
                }

                images.push({[versionKey]: _transformImageDesc(versions[versionKey], schemaItem)});
            }

            attachments.images.push({
                schemaKey: schemaItem,
                versions: images
            });

        }
        else if (schema.tree[schemaItem].type == mongoose.Schema.Types["File"]) {

            attachments.files.push({
                schemaKey: schemaItem,
                extensions: _transformFileTypes(schema.tree[schemaItem]["extension"])
            });
        }
    }

    const forklift = new Forklift(s3);

    schema.pre("save", function (next) {

        const instance = this;

        const images = [];
        const files = [];

        for (let imageField of attachments.images) {

            const schemaKey = imageField["schemaKey"];

            if (!instance[schemaKey] || !instance.isModified(schemaKey)) {
                continue;
            }

            if (!instance[schemaKey].path || !instance[schemaKey].filename) {
                console.log(`${schemaKey} is not valid in instance: ${instance[schemaKey]}`);
                continue;
            }

            images.push({
                versions: imageField["versions"],
                schemaKey: schemaKey
            });
        }

        for (let fileField of attachments.files) {

            const schemaKey = fileField["schemaKey"];

            if (!instance[schemaKey] || !instance.isModified(schemaKey)) {
                continue;
            }

            if (!instance[schemaKey].path || !instance[schemaKey].filename) {
                return next(new Error(`${schemaKey} is not valid in instance: ${instance[schemaKey]}`));
            }

            const ext = _getExtension(instance[schemaKey].filename);
            const name = _getFileName(instance[schemaKey].filename);


            let contentType = "";

            if (instance[schemaKey].headers && instance[schemaKey].headers["content-type"]) {
                contentType = instance[schemaKey].headers["content-type"];
            }

            if (fileField["extensions"].indexOf(ext.toLocaleLowerCase()) == -1) {
                return next(new Error(`${schemaKey} has not valid extension: ${ext}`));
            }

            files.push({
                schemaKey: schemaKey,
                name,
                ext,
                contentType
            });
        }

        Async.auto({

            "uploadFiles": (autoCallback) => {

                if (!attachments.files) {
                    return autoCallback();
                }
                return FileUploader(forklift, instance, files, autoCallback);
            },
            "uploadImages": (autoCallback) => {

                if (!attachments.images) {
                    return autoCallback();
                }
                return ImageUploader(forklift, instance, images, autoCallback);
            }
        }, next);

    });
};

function _transformFileTypes(extensions) {

    if (typeof extensions === "string" || extensions instanceof String) {
        return [extensions];
    }
    return extensions;
}

function _transformImageDesc(versionImage, schemaItem) {

    const Image = {
        output: "jpeg",
        resize: "!"
    };

    if (typeof versionImage === "string" || versionImage instanceof String) {
        Image["size"] = _transformSize(versionImage, schemaItem);
    }
    else { // object
        Image["size"] = _transformSize(versionImage["size"], schemaItem);
        Image["output"] = _transformOutput(versionImage["output"], schemaItem);
        Image["resize"] = _transformResize(versionImage["resize"], schemaItem);
    }

    return Image;
}

function _transformOutput(output, schemaItem) {

    if (!output) {
        return "jpeg";
    }

    if (["jpeg", "jpg", "png"].indexOf(output) == -1) {
        throw new Error(`schemaItem: ${schemaItem}, output:"${output}" is not valid`);
    }

    return output;
}

function _transformResize(resize, schemaItem) {

    if (!resize) {
        return "!";
    }

    if ([">", "<", "!"].indexOf(resize) == -1) {
        throw new Error(`schemaItem: ${schemaItem}, resize:"${resize}" is not valid`);
    }

    return resize;
}

function _transformSize(size, schemaItem) {

    if (!size) {
        throw new Error(`schemaItem: ${schemaItem}, size is not exist in image.`);
    }

    if (size == "keep") {
        return {
            width: 0,
            height: 0
        }
    }

    const sizeArray = size.split("x");
    if (sizeArray.length != 2) {
        throw new Error(`schemaItem: ${schemaItem}, size:"${size}" is not valid`);
    }

    let width;
    let height;

    try {
        width = sizeArray[0] ? parseInt(sizeArray[0]) : null;
        height = sizeArray[1] ? parseInt(sizeArray[1]) : null;
    }
    catch (e) {
        throw new Error(`schemaItem: ${schemaItem}, ${size} is not valid`);
    }

    return {
        width,
        height
    }

}

function _getFileName(fileName) {

    try {
        return fileName && fileName.split(".")[0]
    }
    catch (e) {
        return "";
    }
}

function _getExtension(fileName) {

    try {
        return fileName && fileName.split(".").pop()
    }
    catch (e) {
        return "";
    }
}