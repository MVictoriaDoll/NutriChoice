import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import config from '../config';

const prisma = new PrismaClient();

export const getUserProfile = async ( req: Request, res: Response, next: NextFunction) {

}