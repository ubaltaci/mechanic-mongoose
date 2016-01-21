/**
 *
 * Updated by uur on 12/01/16.
 */

"use strict";

const Async = require("async");

module.exports = (forklift, files, callback) => {

    Async.map(files, (file, eachCallback) => {

        const instance = file.instance;
        const key = file.key;

        let extension;
        try {
            extension = instance[key]["filename"].split(".").pop();
        }
        catch (e) {
            extension = file.kind instanceof Array ? file.kind[0] : file.kind;
        }

        const s3_path = "files/" + file.uploadFolder + "/" + file.instance.id + "_" + file.key + "." + extension + "?" + Date.now();

        forklift.upload(file.instance[key].path, s3_path, {remove: true}, eachCallback);
    }, callback);
};