/**
 *
 * Updated by uur on 12/01/16.
 */

"use strict";

const Async = require("async");
const Sharp = require("sharp");
const Tmp = require("tmp");

module.exports = (forklift, instance, images, callback) => {
    
    Async.each(images, (image, eachCallback) => {

        const localFilePath = instance[image["schemaKey"]]["path"];
        const remoteFolder = `images/${image["schemaKey"]}/${instance._id}-`;

        Async.reduce(image.versions, {}, (uploaded, versionContainer, reduceCallback) => {

            const versionKey = Object.keys(versionContainer)[0];
            const version = versionContainer[versionKey];

            const sharp = Sharp(localFilePath);

            if (version.size["width"] != 0 && version.size["height"] != 0) {

                sharp.resize(version.size["width"], version.size["height"]);
                if (!version.resize || version.resize == "!") {
                    sharp.ignoreAspectRatio();
                }
                else if (version.resize == ">") {
                    sharp.max();
                    sharp.withoutEnlargement();
                }
                else if (version.resize == "<") {
                    sharp.min();
                }
                else {
                    return reduceCallback(new Error(`${version.resize} is not valid for ${versionKey}:${image["schemaKey"]}`))
                }
            }

            if (!version.output || version.output == "jpeg" || version.output == "jpg") {

                sharp.background({r: 255, g: 255, b: 255, a: 1});
                sharp.flatten();
                sharp.jpeg();

                if (version.quality) {
                    sharp.quality(version.quality);
                }
            }
            else if (version.output == "png") {

                sharp.png();
            }
            else {
                return reduceCallback(new Error(`${version.output} is not valid for ${versionKey}:${image["schemaKey"]}`))
            }

            sharp.progressive();

            Tmp.file({postfix: "." + version.output}, (error, path) => {

                if (error) {
                    return reduceCallback(error);
                }

                sharp.toFile(path, (error) => {

                    if (error) {
                        return reduceCallback(error);
                    }

                    forklift.upload(path, remoteFolder + versionKey + "." + version.output, (error, url) => {

                        if (error) {
                            return reduceCallback(error);
                        }

                        uploaded[versionKey] = url;
                        return reduceCallback(null, uploaded);
                    });

                });
            });

        }, (error, result) => {

            if (error) {
                return eachCallback(error);
            }

            instance[image.schemaKey] = result;
            return eachCallback();
        });

    }, callback);
};