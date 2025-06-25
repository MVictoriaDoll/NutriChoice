"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const config_1 = __importDefault(require("../config"));
const errorHandler = (err, req, res, _next) => {
    console.error(`[ERROR] Unhandled error: ${err.message}`);
    if (err.stack && config_1.default.nodeEnv === 'development') {
        console.error(err.stack); // only in dev
    }
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        // detailed stack errors should be avoided for security
        stack: config_1.default.nodeEnv === 'production' ? 'Production error' : err.stack,
    });
};
exports.errorHandler = errorHandler;
