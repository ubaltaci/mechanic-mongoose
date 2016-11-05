"use strict";

const Joi = require("joi");

const AvailablePlugins = {
    "timestamp": require("mongoose-timestamp"),
    "slug": require("./plugins/slug"),
    "shortid": require("./plugins/shortid"),
    "attachment": require("./plugins/attachment")
};

const AvailablePluginsSchema = Joi.array().items(Joi.string().valid(Object.keys(AvailablePlugins)));

const AvailableTypes = {
    "File": require("./types/file"),
    "Image": require("./types/image")
};

class Floppy {

    /**
     * Initialize Forklift
     * @param {object} options
     * @param {[string]} defaultPlugins
     */
    constructor(options = {}, defaultPlugins = []) {

        if (!options.mongoose) {
            throw new Error("Mongoose is not exist or is not valid.");
        }


        if (!options.s3 && (!options.filesystem || !options.filesystem.path || !options.filesystem.url)) {
            console.log("throwing error!");
            throw new Error("S3 or Filesystem should be passed to Floppy constructor");
        }

        const result = Joi.validate(defaultPlugins, AvailablePluginsSchema);

        if (result.error) {
            throw result.error;
        }

        this.options = options;
        this.defaultPlugins = result.value;

        this._registerTypes();
    }

    /**
     * Get available types
     * @returns {[string]}
     */
    static getAvailableTypes() {
        return Object.keys(AvailableTypes);
    }

    /**
     * Register gives types
     * @private
     */
    _registerTypes() {

        for (let typeName of Floppy.getAvailableTypes()) {
            AvailableTypes[typeName](this.options.mongoose);
        }
    }

    setPlugins(schema, overridePlugins = []) {

        let plugins = this.defaultPlugins;
        if (overridePlugins && overridePlugins.length > 0) {
            let result = Joi.validate(overridePlugins, AvailablePluginsSchema);

            if (result.error) {
                throw result.error;
            }
            plugins = result.value;
        }

        for(let plugin of plugins) {
            
            AvailablePlugins[plugin](schema, this.options);
        }
    }
}

module.exports = Floppy;