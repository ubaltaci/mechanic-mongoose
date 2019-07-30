const Slug = require("speakingurl");
const ShortId = require("shortid");

/**
 *
 * @param schema
 * @param options
 */
module.exports = (schema, options) => {

    const mongoose = options.mongoose;
    const defaultLanguage = options.language || "tr";
    const schemaItems = Object.keys(schema.tree);
    const slugItems = [];

    for (let schemaItem of schemaItems) {

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

        if (schema.tree[schemaItem].slug
            && (schema.tree[schemaItem].type === String || (schema.tree[schemaItem].type === mongoose.Schema.Types["String"]))) {

            const referenceKey = schema.tree[schemaItem].slug;

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
                main: schemaItem,
                slug: referenceKey
            });
        }

    }

    schema.pre("save", async function preSaveSlug() {

        const instance = this;

        for (const slugItem of slugItems) {

            if (instance.isModified(slugItem.main)) {

                const slugVal = generateSlug({
                    val: instance[slugItem.main],
                    key: slugItem.main,
                    defaultLanguage
                });

                const collapsedInstance = await instance.constructor.findOne({
                    [slugItem.slug]: slugVal
                });

                if (collapsedInstance && (collapsedInstance._id.toString() !== instance._id.toString())) {
                    instance[slugItem.slug] = `${slugVal}-${ShortId.generate()}`;
                }
                else {
                    instance[slugItem.slug] = slugVal;
                }
            }
        }
    });
};

function generateSlug({val, key, defaultLanguage}) {

    let language = defaultLanguage;

    if (key.endsWith("_en")) {
        language = "en";
    }
    else if (key.endsWith("_tr")) {
        language = "tr";
    }

    return Slug(val, {lang: language});
}
