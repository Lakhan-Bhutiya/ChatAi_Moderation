"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldSample = shouldSample;
var crypto_1 = require("crypto");
function shouldSample(rate) {
    if (rate >= 1)
        return true;
    if (rate <= 0)
        return false;
    return (0, crypto_1.randomInt)(0, 100) < rate * 100;
}
