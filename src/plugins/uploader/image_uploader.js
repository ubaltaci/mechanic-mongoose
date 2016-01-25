/**
 *
 * Updated by uur on 12/01/16.
 */

"use strict";

const Async = require("async");
const Sharp = require("sharp");
const Tmp = require("tmp");
const Uuid = require("node-uuid");

module.exports = (forklift, instance, images, callback) => {

    Async.map(images, (image, eachCallback) => {

        const localFilePath = instance[image["schemaKey"]]["path"];
        const remoteFolder = `images/${image["schemaKey"]}/${Uuid.v4()}-`;

        Async.reduce(image.versions, {}, (uploaded, versionContainer, reduceCallback) => {

            const versionKey = Object.keys(versionContainer)[0];
            const version = versionContainer[versionKey];

            const sharp = Sharp(localFilePath).resize(version.size["width"], version.size["height"]);
            
            if (!version.resize || version.resize == "!") {
                sharp.ignoreAspectRatio();
            }
            else if (version.resize == "^") {

            }
            else if (version.resize == ">" && (!version.size["width"] || !version.size["height"])) {

            }
            else if (version.resize == ">" && version.size["width"] && version.size["height"]) {
                sharp.min();
            }
            else {
                return reduceCallback(new Error(`${version.resize} is not valid for ${versionKey}:${image["schemaKey"]}`))
            }

            if (!version.output || version.output == "jpeg" || version.output == "jpg") {
                console.log("fuck!");
                sharp.jpeg().quality(80);
            }
            else if (version.output == "png") {
                sharp.png();
            }
            else {
                return reduceCallback(new Error(`${version.output} is not valid for ${versionKey}:${image["schemaKey"]}`))
            }
            
            Tmp.file((error, path) => {

                if (error) {
                    return reduceCallback(error);
                }

                sharp.toFormat("jpeg").toFile(path, (error) => {

                    if (error) {
                        return reduceCallback(error);
                    }

                    forklift.upload(path, remoteFolder + versionKey + "." + version.output, (error, url) => {

                        console.log(error);
                        console.log(url);
                        return reduceCallback(null, {});
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