/**
 *
 * Updated by uur on 12/01/16.
 */

"use strict";

const Path = require("path");
const Fse = require("fs-extra");

const Async = require("async");
const Sharp = require("sharp");
const Tmp = require("tmp");

module.exports = (instance, images, forklift, filesystem, callback) => {

    Async.each(images, (image, eachCallback) => {

        const localFilePath = instance[image["schemaKey"]]["path"];
        const remoteFolder = `images/${image["schemaKey"]}/${instance._id}-`;

        const isFileSystem = filesystem && filesystem.path && filesystem.url;

        Async.reduce(image.versions, {}, (uploaded, versionContainer, reduceCallback) => {

            const versionKey = Object.keys(versionContainer)[0];
            const version = versionContainer[versionKey];

            const sharp = Sharp(localFilePath);

            sharp.resize(version.size["width"], version.size["height"]);

            if (version.size["width"] && version.size["width"] != 0 && version.size["height"] && version.size["height"] != 0) {

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

            const outputOptions = {
                progressive: true
            };

            if (!version.output || version.output == "jpeg" || version.output == "jpg") {

                sharp.background({r: 255, g: 255, b: 255, alpha: 1});
                sharp.flatten();

                if (version.quality) {
                    outputOptions.quality = version.quality;
                }

                sharp.jpeg(outputOptions);
            }
            else if (version.output == "png") {

                sharp.png(outputOptions);
            }
            else {
                return reduceCallback(new Error(`${version.output} is not valid for ${versionKey}:${image["schemaKey"]}`))
            }

            const remote = remoteFolder + versionKey + "." + version.output;

            Async.auto({

                "createPath": (autoCallback) => {

                    if (isFileSystem) {
                        return autoCallback(null, Path.join(filesystem.path, remote));
                    }

                    Tmp.file({postfix: "." + version.output}, (error, path) => {

                        if (error) {
                            return autoCallback(error);
                        }

                        return autoCallback(null, path);
                    });
                },
                "processSharp": ["createPath", (result, autoCallback) => {

                    const filePath = result.createPath;
                    if (!filePath) {
                        return autoCallback(new Error("File path does not exist."));
                    }

                    return Fse.ensureDir(Path.dirname(filePath), (error) => {

                        if (error) {
                            return autoCallback(error);
                        }

                        return sharp.toFile(filePath, autoCallback);
                    });

                }],
                "upload": ["processSharp", (result, autoCallback) => {

                    const filePath = result.createPath;

                    if (isFileSystem) {
                        uploaded[versionKey] = `${Path.join(filesystem.url, remote)}?${Date.now()}`;
                        return autoCallback(null, uploaded);
                    }

                    return forklift.upload(filePath, remote, (error, url) => {

                        if (error) {
                            console.log(error);
                            return autoCallback(error);
                        }

                        uploaded[versionKey] = url;
                        return autoCallback(null, uploaded);
                    });
                }]
            }, (error, result) => {

                if (error) {
                    console.log(error);
                    return reduceCallback(error);
                }

                const uploaded = result.upload;
                return reduceCallback(null, uploaded);
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