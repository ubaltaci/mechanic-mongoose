/**
 *
 * Updated by uur on 12/01/16.
 */

"use strict";

var Async = require("async");
var Sharp = require("sharp");
var Tmp = require("tmp");
var Uuid = require("node-uuid");

module.exports = function (forklift, instance, images, callback) {

    Async.map(images, function (image, eachCallback) {

        var localFilePath = instance[image["schemaKey"]]["path"];
        var remoteFolder = "images/" + image["schemaKey"] + "/" + Uuid.v4() + "-";

        Async.reduce(image.versions, {}, function (uploaded, versionContainer, reduceCallback) {

            var versionKey = Object.keys(versionContainer)[0];
            var version = versionContainer[versionKey];

            var sharp = Sharp(localFilePath).resize(version.size["width"], version.size["height"]);

            console.log(version);

            if (!version.resize || version.resize == "!") {
                sharp.ignoreAspectRatio();
            } else if (version.resize == "^") {} else if (version.resize == ">" && (!version.size["width"] || !version.size["height"])) {} else if (version.resize == ">" && version.size["width"] && version.size["height"]) {
                sharp.min();
            } else {
                return reduceCallback(new Error(version.resize + " is not valid for " + versionKey + ":" + image["schemaKey"]));
            }

            if (!version.output || version.output == "jpeg" || version.output == "jpg") {
                console.log("fuck!");
                sharp.jpeg().quality(80);
            } else if (version.output == "png") {
                sharp.png();
            } else {
                return reduceCallback(new Error(version.output + " is not valid for " + versionKey + ":" + image["schemaKey"]));
            }

            Tmp.file(function (error, path) {

                if (error) {
                    return reduceCallback(error);
                }

                sharp.toFormat("jpeg").toFile(path, function (error) {

                    if (error) {
                        return reduceCallback(error);
                    }

                    forklift.upload(path, remoteFolder + versionKey + "." + version.output, function (error, url) {

                        console.log(error);
                        console.log(url);
                        return reduceCallback(null, {});
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