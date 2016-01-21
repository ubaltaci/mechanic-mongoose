const Slug = require("speakingurl");
const Async = require("async");
const ShortId = require("shortid");

/**
 *
 * @param schema
 * @param options
 */
module.exports = (schema, options) => {

    const mongoose = options.mongoose;
    const modelItems = Object.keys(schema.tree);
    const slugItems = [];

    for (let modelItem of modelItems) {

        /**
         * test_title: String
         * olamaz, propertylerinde slug: "slug_key" olması lazım.
         *
         * test_title: {
         *    type: String,
         *    slug: "test_slug"
         * }
         *
         */

        if (schema.tree[modelItem].slug
            && (schema.tree[modelItem].type == String || (schema.tree[modelItem].type == mongoose.Schema.Types["String"]))) {

            const referenceKey = schema.tree[modelItem].slug;
            if (schema.tree[referenceKey]) {
                throw new Error(`Ref: ${referenceKey} in slug is used in another key.`);
            }

            schema.add({
                [referenceKey]: {
                    type: String,
                    unique: true,
                    lowercase: true,
                    trim: true
                }
            });

            slugItems.push({
                main: modelItem,
                slug: referenceKey
            });
        }

    }

    schema.pre("save", function (next) {

        const instance = this;

        Async.each(slugItems, (slugItem, eachCallback) => {

            if (!instance.isModified(slugItem.main)) {
                return eachCallback();
            }
            return _createSlug(instance, slugItem, eachCallback);

        }, (error) => {
            if (error) {
                return next(error);
            }
            return next();
        });

    });
};

function _createSlug(instance, slugItem, callback) {

    const slugValue = Slug(instance[slugItem.main]);

    instance.constructor.findOne({
        [slugItem.slug]: slugValue
    }, (error, collapsedInstance) => {

        if (error) {
            return callback(error);
        }

        if (collapsedInstance && (collapsedInstance._id.toString() != instance._id.toString())) {
            instance[slugItem.slug] = slugValue + "-" + ShortId.generate();
            return callback();
        }

        instance[slugItem.slug] = slugValue;
        return callback();
    });

}