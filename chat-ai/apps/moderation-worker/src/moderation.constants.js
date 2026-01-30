"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MINOR_KEYWORDS = exports.MAJOR_KEYWORDS = exports.SAMPLING_RATE = void 0;
exports.SAMPLING_RATE = {
    TRUSTED: 0.25,
    NEUTRAL: 0.75,
    SUSPECT: 1.0,
};
// TEMP hard-coded keywords to simulate moderation
exports.MAJOR_KEYWORDS = ['kill', 'rape', 'terror'];
exports.MINOR_KEYWORDS = ['idiot', 'stupid', 'dumb'];
