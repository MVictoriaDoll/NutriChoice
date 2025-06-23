"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const config = {
    port: process.env.PORT || 3000,
    databaseUrl: process.env.DATABASE_URL,
    frondendBuildPath: path_1.default.join(__dirname, '..', '..', '..', 'client', 'dist'),
    nodeEnv: process.env.NODE_ENV || 'development',
};
if (!config.databaseUrl) {
    console.error('FATAL ERROR: DATABASE_URL is not defined in .env');
    process.exit(1);
}
if (!process.env.NODE_ENV) {
    console.warn('WARNING: NODE_ENV is not set. Defaulting to "development".');
}
exports.default = config;
