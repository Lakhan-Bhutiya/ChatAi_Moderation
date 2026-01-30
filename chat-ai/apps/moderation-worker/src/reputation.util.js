"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTier = calculateTier;
/**
 * Pure business logic.
 * No entity imports.
 * Safe for worker.
 */
function calculateTier(score) {
    if (score >= 80)
        return 'trusted';
    if (score >= 40)
        return 'neutral';
    return 'suspect';
}
