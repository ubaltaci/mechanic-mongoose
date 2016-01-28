/**
 *
 * Updated by uur on 12/01/16.
 */

"use strict";

const Async = require("async");
const Sharp = require("sharp");
const Tmp = require("tmp");

module.exports = (forklift, instance, images, callback) => {

    console.log("4");

    Async.each(images, (image, eachCallback) => {

        const localFilePath = instance[image["schemaKey"]]["path"];
        const remoteFolder = `images/${image["schemaKey"]}/${instance._id}-`;

        Async.reduce(image.versions, {}, (uploaded, versionContainer, reduceCallback) => {

            console.log("5");
            const versionKey = Object.keys(versionContainer)[0];
            const version = versionContainer[versionKey];

            const sharp = Sharp(localFilePath).resize(version.size["width"], version.size["height"]);
            
            if (!version.resize || version.resize == "!") {
                sharp.ignoreAspectRatio();
            }
            else if (version.resize == "^") {

            }
            else if (version.resize == ">" && (!version.size["width"] || !version.size["height"])) {
                sharp.min();
            }
            else if (version.resize == ">" && version.size["width"] && version.size["height"]) {
                sharp.min();
            }
            else {
                return reduceCallback(new Error(`${version.resize} is not valid for ${versionKey}:${image["schemaKey"]}`))
            }

            if (!version.output || version.output == "jpeg" || version.output == "jpg") {
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

            console.log("6");
            sharp.progressive();
            
            Tmp.file({postfix: "." + version.output}, (error, path) => {

                console.log("7");
                if (error) {
                    return reduceCallback(error);
                }

                console.log("8");
                sharp.toFile(path, (error) => {

                    if (error) {
                        return reduceCallback(error);
                    }

                    forklift.upload(path, remoteFolder + versionKey + "." + version.output, (error, url) => {

                        console.log(error);
                        console.log("8.1");
                        console.log(url);
                        
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