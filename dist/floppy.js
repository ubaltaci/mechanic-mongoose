"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Joi = require("joi");

var AvailablePlugins = {
    "timestamp": require("mongoose-timestamp"),
    "slug": require("./plugins/slug"),
    "shortid": require("./plugins/shortid"),
    "attachment": require("./plugins/attachment")
};

var AvailablePluginsSchema = Joi.array().items(Joi.string().valid(Object.keys(AvailablePlugins)));

var AvailableTypes = {
    "File": require("./types/file"),
    "Image": require("./types/image")
};

var Floppy = function () {

    /**
     * Initialize Forklift
     * @param {object} options
     * @param {[string]} defaultPlugins
     */

    function Floppy() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
        var defaultPlugins = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

        _classCallCheck(this, Floppy);

        if (!options.mongoose || !options.mongoose["connection"]) {
            throw new Error("Mongoose is not exist or is not valid.");
        }

        if (!options.s3) {
            throw new Error("S3 should be passed to Floppy constructor");
        }

        var result = Joi.validate(defaultPlugins, AvailablePluginsSchema);

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

    _createClass(Floppy, [{
        key: "_registerTypes",

        /**
         * Register gives types
         * @private
         */
        value: function _registerTypes() {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {

                for (var _iterator = Floppy.getAvailableTypes()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var typeName = _step.value;

                    AvailableTypes[typeName](this.options.mongoose);
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
        }
    }, {
        key: "setPlugins",
        value: function setPlugins(schema) {
            var overridePlugins = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

            console.log(schema);

            var plugins = this.defaultPlugins;
            if (overridePlugins && overridePlugins.length > 0) {
                var result = Joi.validate(overridePlugins, AvailablePluginsSchema);

                if (result.error) {
                    throw result.error;
                }
                plugins = result.value;
            }

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = plugins[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var plugin = _step2.value;

                    console.log(plugin);

                    AvailablePlugins[plugin](schema, this.options);
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
        }
    }], [{
        key: "getAvailableTypes",
        value: function getAvailableTypes() {
            return Object.keys(AvailableTypes);
        }
    }]);

    return Floppy;
}();

module.exports = Floppy;
//# sourceMappingURL=floppy.js.map