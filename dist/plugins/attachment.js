/**
 *
 * Updated by uur on 12/01/16.
 */

"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Async = require("async");
var Forklift = require("s3-forklift");
var FileUploader = require("./uploader/file_uploader");
var ImageUploader = require("./uploader/image_uploader");
var CheckAttachments = require("./validation/check_attachments");

/**
 * @param schema
 * @param options
 */

module.exports = function (schema, options) {

    var mongoose = options.mongoose;
    var s3 = options.s3;

    if (!s3 || !mongoose) {
        console.log("Options passed to mechanic-mongoose does not contain s3 credentials.");
    }

    schema.statics.checkAttachments = function (payload, instance, schema, errors) {

        CheckAttachments(mongoose, payload, instance, schema, errors);
        return errors;
    };

    var schemaItems = Object.keys(schema.tree);

    var attachments = {
        images: [],
        files: []
    };

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = schemaItems[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var schemaItem = _step.value;


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

                var versions = schema.tree[schemaItem]["versions"] || {};

                if (typeof versions === "string" || versions instanceof String) {

                    attachments.images.push({
                        schemaKey: schemaItem,
                        versions: [_defineProperty({}, "main", _transformImageDesc(versions, schemaItem))]
                    });
                    continue;
                }

                var versionKeys = Object.keys(versions);
                if (versionKeys.indexOf("original") != -1) {
                    throw new Error(schemaItem + " contains 'original' key which do not valid.");
                }

                var images = [];
                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                    for (var _iterator4 = versionKeys[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                        var versionKey = _step4.value;


                        if (versionKey == "type") {
                            continue;
                        }

                        images.push(_defineProperty({}, versionKey, _transformImageDesc(versions[versionKey], schemaItem)));
                    }
                } catch (err) {
                    _didIteratorError4 = true;
                    _iteratorError4 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion4 && _iterator4.return) {
                            _iterator4.return();
                        }
                    } finally {
                        if (_didIteratorError4) {
                            throw _iteratorError4;
                        }
                    }
                }

                attachments.images.push({
                    schemaKey: schemaItem,
                    versions: images
                });
            } else if (schema.tree[schemaItem].type == mongoose.Schema.Types["File"]) {

                attachments.files.push({
                    schemaKey: schemaItem,
                    extensions: _transformFileTypes(schema.tree[schemaItem]["extension"])
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

    var forklift = new Forklift(s3);

    schema.pre("save", function (next) {

        var instance = this;

        var images = [];
        var files = [];

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = attachments.images[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var imageField = _step2.value;


                var schemaKey = imageField["schemaKey"];

                if (!instance[schemaKey] || !instance.isModified(schemaKey)) {
                    continue;
                }

                if (!instance[schemaKey].path || !instance[schemaKey].filename) {
                    console.log(schemaKey + " is not valid in instance: " + instance[schemaKey]);
                    continue;
                }

                images.push({
                    versions: imageField["versions"],
                    schemaKey: schemaKey
                });
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }

        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = attachments.files[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var fileField = _step3.value;


                var _schemaKey = fileField["schemaKey"];

                if (!instance[_schemaKey] || !instance.isModified(_schemaKey)) {
                    continue;
                }

                if (!instance[_schemaKey].path || !instance[_schemaKey].filename) {
                    return next(new Error(_schemaKey + " is not valid in instance: " + instance[_schemaKey]));
                }

                var ext = _getExtension(instance[_schemaKey].filename);
                var name = _getFileName(instance[_schemaKey].filename);

                if (fileField["extensions"].indexOf(ext.toLocaleLowerCase()) == -1) {
                    return next(new Error(_schemaKey + " has not valid extension: " + ext));
                }

                files.push({
                    schemaKey: _schemaKey,
                    name: name,
                    ext: ext
                });
            }
        } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                }
            } finally {
                if (_didIteratorError3) {
                    throw _iteratorError3;
                }
            }
        }

        Async.auto({

            "uploadFiles": function uploadFiles(autoCallback) {

                if (!attachments.files) {
                    return autoCallback();
                }
                return FileUploader(forklift, instance, files, autoCallback);
            },
            "uploadImages": function uploadImages(autoCallback) {

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

    var Image = {
        output: "jpeg",
        resize: "!"
    };

    if (typeof versionImage === "string" || versionImage instanceof String) {
        Image["size"] = _transformSize(versionImage, schemaItem);
    } else {
        // object
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
        throw new Error("schemaItem: " + schemaItem + ", output:\"" + output + "\" is not valid");
    }

    return output;
}

function _transformResize(resize, schemaItem) {

    if (!resize) {
        return "!";
    }

    if ([">", "<", "!"].indexOf(resize) == -1) {
        throw new Error("schemaItem: " + schemaItem + ", resize:\"" + resize + "\" is not valid");
    }

    return resize;
}

function _transformSize(size, schemaItem) {

    if (!size) {
        throw new Error("schemaItem: " + schemaItem + ", size is not exist in image.");
    }

    if (size == "keep") {
        return {
            width: 0,
            height: 0
        };
    }

    var sizeArray = size.split("x");
    if (sizeArray.length != 2) {
        throw new Error("schemaItem: " + schemaItem + ", size:\"" + size + "\" is not valid");
    }

    var width = void 0;
    var height = void 0;

    try {
        width = sizeArray[0] ? parseInt(sizeArray[0]) : null;
        height = sizeArray[1] ? parseInt(sizeArray[1]) : null;
    } catch (e) {
        throw new Error("schemaItem: " + schemaItem + ", " + size + " is not valid");
    }

    return {
        width: width,
        height: height
    };
}

function _getFileName(fileName) {

    try {
        return fileName && fileName.split(".")[0];
    } catch (e) {
        return "";
    }
}

function _getExtension(fileName) {

    try {
        return fileName && fileName.split(".").pop();
    } catch (e) {
        return "";
    }
}
//# sourceMappingURL=attachment.js.map