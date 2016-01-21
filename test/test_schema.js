/**
 *
 * Created by uur on 18/10/14.
 * 01.12.2015 -> new languages added.
 */

module.exports = (mongoose) => {
    return new mongoose.Schema({

        test_horizontal_image: {
            type: mongoose.Schema.Types["Image"],
            size: {
                width: 1024,
                height: 512,
                resize: ">"
            }
        },
        test_vertical_image: {
            type: mongoose.Schema.Types["Image"],
            size: {
                width: 480,
                height: 720,
                resize: ">"
            }
        },
        test_title: {
            type: String,
            slug: "test_slug"
        }

    });
};


