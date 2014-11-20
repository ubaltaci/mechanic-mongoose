/**
 *
 * Created by uur on 20/11/14.
 */

module.exports = function(Mongoose) {
    require("./image")(Mongoose);
    require("./file")(Mongoose);
};