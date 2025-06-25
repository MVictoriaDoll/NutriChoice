"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const authenticateUser = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        console.warn('Authentication failed: X-User-Id header is missing.');
        res.status(401).json({
            message: 'User ID (X-User-Id header) is required.',
        });
        return;
    }
    try {
        const user = await prisma.user.upsert({
            where: { id: userId },
            update: {
                lastLogin: new Date(), // updates the last login timestamp on every interaction.
            },
            create: {
                id: userId,
                displayName: `Guest-${userId.substring(0, 8)}`,
                preferences: {},
            },
        });
        req.userId = user.id;
        console.debug(`User authenticated (or created): ${req.userId}`);
        next();
    }
    catch (error) {
        console.error('Error in authentication middleware (user upsert): ', error);
        next(error);
    }
};
exports.authenticateUser = authenticateUser;
