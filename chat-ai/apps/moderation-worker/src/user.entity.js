"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
var typeorm_1 = require("typeorm");
var User = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('users')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _reputationScore_decorators;
    var _reputationScore_initializers = [];
    var _reputationScore_extraInitializers = [];
    var _tier_decorators;
    var _tier_initializers = [];
    var _tier_extraInitializers = [];
    var _cleanMessageCount_decorators;
    var _cleanMessageCount_initializers = [];
    var _cleanMessageCount_extraInitializers = [];
    var _warningIssued_decorators;
    var _warningIssued_initializers = [];
    var _warningIssued_extraInitializers = [];
    var User = _classThis = /** @class */ (function () {
        function User_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.reputationScore = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _reputationScore_initializers, void 0));
            this.tier = (__runInitializers(this, _reputationScore_extraInitializers), __runInitializers(this, _tier_initializers, void 0));
            this.cleanMessageCount = (__runInitializers(this, _tier_extraInitializers), __runInitializers(this, _cleanMessageCount_initializers, void 0));
            this.warningIssued = (__runInitializers(this, _cleanMessageCount_extraInitializers), __runInitializers(this, _warningIssued_initializers, void 0));
            __runInitializers(this, _warningIssued_extraInitializers);
        }
        return User_1;
    }());
    __setFunctionName(_classThis, "User");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _reputationScore_decorators = [(0, typeorm_1.Column)()];
        _tier_decorators = [(0, typeorm_1.Column)({ type: 'enum', enum: ['trusted', 'neutral', 'suspect'] })];
        _cleanMessageCount_decorators = [(0, typeorm_1.Column)()];
        _warningIssued_decorators = [(0, typeorm_1.Column)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _reputationScore_decorators, { kind: "field", name: "reputationScore", static: false, private: false, access: { has: function (obj) { return "reputationScore" in obj; }, get: function (obj) { return obj.reputationScore; }, set: function (obj, value) { obj.reputationScore = value; } }, metadata: _metadata }, _reputationScore_initializers, _reputationScore_extraInitializers);
        __esDecorate(null, null, _tier_decorators, { kind: "field", name: "tier", static: false, private: false, access: { has: function (obj) { return "tier" in obj; }, get: function (obj) { return obj.tier; }, set: function (obj, value) { obj.tier = value; } }, metadata: _metadata }, _tier_initializers, _tier_extraInitializers);
        __esDecorate(null, null, _cleanMessageCount_decorators, { kind: "field", name: "cleanMessageCount", static: false, private: false, access: { has: function (obj) { return "cleanMessageCount" in obj; }, get: function (obj) { return obj.cleanMessageCount; }, set: function (obj, value) { obj.cleanMessageCount = value; } }, metadata: _metadata }, _cleanMessageCount_initializers, _cleanMessageCount_extraInitializers);
        __esDecorate(null, null, _warningIssued_decorators, { kind: "field", name: "warningIssued", static: false, private: false, access: { has: function (obj) { return "warningIssued" in obj; }, get: function (obj) { return obj.warningIssued; }, set: function (obj, value) { obj.warningIssued = value; } }, metadata: _metadata }, _warningIssued_initializers, _warningIssued_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        User = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return User = _classThis;
}();
exports.User = User;
