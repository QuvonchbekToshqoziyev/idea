import {
  Injectable,
  OnModuleInit,
  INestApplication,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// In-memory fallback model
class InMemoryModel {
  private data: any[] = [];

  async findFirst(where: any) {
    return (
      this.data.find((item) =>
        Object.entries(where).every(([key, value]) => item[key] === value),
      ) || null
    );
  }

  async findUnique(where: any) {
    return (
      this.data.find((item) =>
        Object.entries(where).every(([key, value]) => item[key] === value),
      ) || null
    );
  }

  async create(data: any) {
    const item = { id: Math.random().toString(36).substr(2, 9), ...data };
    this.data.push(item);
    return item;
  }

  async findMany(where?: any) {
    if (!where) return this.data;
    return this.data.filter((item) =>
      Object.entries(where).every(([key, value]) => item[key] === value),
    );
  }

  async update(where: any, data: any) {
    const index = this.data.findIndex((item) =>
      Object.entries(where).every(([key, value]) => item[key] === value),
    );
    if (index === -1) return null;
    this.data[index] = { ...this.data[index], ...data };
    return this.data[index];
  }

  async delete(where: any) {
    const index = this.data.findIndex((item) =>
      Object.entries(where).every(([key, value]) => item[key] === value),
    );
    if (index === -1) return null;
    return this.data.splice(index, 1)[0];
  }
}

@Injectable()
export class PrismaService implements OnModuleInit {
  private logger = new Logger('PrismaService');
  private prismaClient: any = null;
  private usingFallback = false;

  user: any;
  category: any;
  plan: any;
  planInspiration: any;
  friendship: any;
  progressUpdate: any;
  comment: any;
  session: any;
  inspirationItem: any;
  sessionInspiration: any;
  milestone: any;

  constructor() {
    this.initializeModels();
  }

  private useFallbackModels() {
    this.usingFallback = true;
    this.user = new InMemoryModel();
    this.category = new InMemoryModel();
    this.plan = new InMemoryModel();
    this.planInspiration = new InMemoryModel();
    this.friendship = new InMemoryModel();
    this.progressUpdate = new InMemoryModel();
    this.comment = new InMemoryModel();
    this.session = new InMemoryModel();
    this.inspirationItem = new InMemoryModel();
    this.sessionInspiration = new InMemoryModel();
    this.milestone = new InMemoryModel();
  }

  private initializeModels() {
    try {
      this.prismaClient = new PrismaClient();
      this.user = this.prismaClient.user;
      this.category = this.prismaClient.category;
      this.plan = this.prismaClient.plan;
      this.planInspiration = this.prismaClient.planInspiration;
      this.friendship = this.prismaClient.friendship;
      this.progressUpdate = this.prismaClient.progressUpdate;
      this.comment = this.prismaClient.comment;
      this.session = this.prismaClient.session;
      this.inspirationItem = this.prismaClient.inspirationItem;
      this.sessionInspiration = this.prismaClient.sessionInspiration;
      this.milestone = this.prismaClient.milestone;
    } catch {
      this.logger.warn(
        'Failed to initialize Prisma client, using in-memory fallback',
      );
      this.useFallbackModels();
    }
  }

  async onModuleInit() {
    if (!this.usingFallback && this.prismaClient) {
      try {
        await this.prismaClient.$connect();
        this.logger.log('Database connection established');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Database connection failed: ${message}. Using in-memory fallback.`,
        );
        this.useFallbackModels();
      }
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    if (!this.usingFallback && this.prismaClient) {
      // Disconnect on shutdown
      app.enableShutdownHooks();
    }
  }
}
