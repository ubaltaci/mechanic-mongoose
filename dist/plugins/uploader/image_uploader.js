/**
 *
 * Updated by uur on 12/01/16.
 */

"use strict";

var Async = require("async");
var Sharp = require("sharp");
var Tmp = require("tmp");

module.exports = function (forklift, instance, images, callback) {

    Async.each(images, function (image, eachCallback) {

        var localFilePath = instance[image["schemaKey"]]["path"];
        var remoteFolder = "images/" + image["schemaKey"] + "/" + instance._id + "-";

        Async.reduce(image.versions, {}, function (uploaded, versionContainer, reduceCallback) {

            var versionKey = Object.keys(versionContainer)[0];
            var version = versionContainer[versionKey];

            var sharp = Sharp(localFilePath);

            sharp.resize(version.size["width"], version.size["height"]);

            if (version.size["width"] && version.size["width"] != 0 && version.size["height"] && version.size["height"] != 0) {

                if (!version.resize || version.resize == "!") {
                    sharp.ignoreAspectRatio();
                } else if (version.resize == ">") {
                    sharp.max();
                    sharp.withoutEnlargement();
                } else if (version.resize == "<") {
                    sharp.min();
                } else {
                    return reduceCallback(new Error(version.resize + " is not valid for " + versionKey + ":" + image["schemaKey"]));
                }
            }

            if (!version.output || version.output == "jpeg" || version.output == "jpg") {

                sharp.background({ r: 255, g: 255, b: 255, a: 1 });
                sharp.flatten();
                sharp.jpeg();

                if (version.quality) {
                    sharp.quality(version.quality);
                }
            } else if (version.output == "png") {

                sharp.png();
            } else {
                return reduceCallback(new Error(version.output + " is not valid for " + versionKey + ":" + image["schemaKey"]));
            }

            sharp.progressive();

            Tmp.file({ postfix: "." + version.output }, function (error, path) {

                if (error) {
                    return reduceCallback(error);
                }

                sharp.toFile(path, function (error) {

                    if (error) {
                        return reduceCallback(error);
                    }

                    forklift.upload(path, remoteFolder + versionKey + "." + version.output, { timestamp: true }, function (error, url) {

                        if (error) {
                            return reduceCallback(error);
                        }

                        uploaded[versionKey] = url;
                        return reduceCallback(null, uploaded);
                    });
                });
            });
        }, function (error, result) {

            if (error) {
                return eachCallback(error);
            }

            instance[image.schemaKey] = result;
            return eachCallback();
        });
    }, callback);
};
//# sourceMappingURL=image_uploader.js.map