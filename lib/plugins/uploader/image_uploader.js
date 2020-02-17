/**
 * Image Uploader
 */

const Path = require("path");
const UUID = require("uuid/v4");
const Sharp = require("sharp");
const Tmp = require("tmp-promise");
const Fse = require("fs-extra");

module.exports = class ImageUploader {

    constructor({modelName, forklift, filesystem}) {

        this.modelName = modelName;
        this.isFileSystem = filesystem && filesystem.path && filesystem.url;
        this.filesystem = filesystem;
        this.forklift = forklift;
        this.fieldName = "";
    }

    async uploadImages(instance, images) {

        for (const image of images) {

            this.fieldName = image["schemaKey"];
            const localFilePath = instance[this.fieldName]["path"];
            const versions = image.versions;

            const sharp = Sharp(localFilePath);
            const uploadedImages = {};

            for (const version of versions) {

                const versionKey = version.versionKey;

                // This will update sharp object with necessary files amd return postfix data.
                const extension = this._transformImageSettingsToSharp(sharp, version.versionDesc);

                // Remote path.
                // Ex: /store/store_logo/main/34-341-541-531.jpg
                const remotePath = `images/${this.modelName.toLowerCase()}/${this.fieldName}/${versionKey.toLowerCase()}/`;
                const fileName = `${UUID()}.${extension}`;

                let uploadedFile = "";

                if (this.isFileSystem) {

                    uploadedFile = `${Path.join(this.filesystem.url, remotePath, fileName)}?${Date.now()}`;
                    const serverPath = Path.join(this.filesystem.path, remotePath);
                    await Fse.ensureDir(serverPath);

                    // Process sharp
                    await sharp.toFile(Path.join(serverPath, fileName));
                }
                else {
                    // Create tmp file
                    const {path} = await Tmp.file({postfix: `.${extension}`});
                    // Process sharp
                    await sharp.toFile(path);

                    uploadedFile = await this.forklift.upload({
                        source: path,
                        remotePath: Path.join(remotePath, fileName)
                    });
                }

                uploadedImages[versionKey] = `${uploadedFile}?${Date.now()}`;
            }

            if (this.isFileSystem) { // manually remove file.
                await Fse.remove(localFilePath);
            }

            // eslint-disable-next-line
            instance[this.fieldName] = uploadedImages;
        }
    }

    _transformImageSettingsToSharp(sharp, {size, resize = "!", output = "jpg", quality = 90}) {

        if (["jpeg", "jpg", "png"].indexOf(output) === -1) {
            throw new Error(`Model: ${this.modelName}, Item: ${this.fieldName}, output:"${output}" option is not valid`);
        }

        sharp.rotate();

        if (output === "jpeg" || output === "jpg") {

            sharp.flatten();
            sharp.jpeg({
                progressive: true,
                quality

            });
        }
        else if (output === "png") {

            sharp.png({
                progressive: true,
                quality
            });
        }

        if (!size) {
            throw new Error(`Model: ${this.modelName}, Item: ${this.fieldName}, size is not exist in image.`);
        }

        if ([">", "<", "!", "^"].indexOf(resize) === -1) {
            throw new Error(`Model: ${this.modelName}, Item: ${this.fieldName}, resize:"${resize}" is not valid`);
        }

        const {width, height} = size;

        const resizeOptions = {
        };

        if (resize === "!") {
            resizeOptions["fit"] = Sharp.fit.fill;
        }
        else if (resize === ">") {
            resizeOptions["fit"] = Sharp.fit.outside;
        }
        else if (resize === "<") {
            resizeOptions["fit"] = Sharp.fit.inside;
        }
        else if (resize === "^") {

            resizeOptions["fit"] = Sharp.fit.cover;
            if (output === "jpg" || output === "jpeg") {
                resizeOptions["background"] = {r: 255, g: 255, b: 255, alpha: 1};
            }
            else if (output === "png") {
                resizeOptions["background"] = {r: 255, g: 255, b: 255, alpha: 0};
            }
        }

        sharp.resize(width, height, resizeOptions);

        return output;
    }
};
