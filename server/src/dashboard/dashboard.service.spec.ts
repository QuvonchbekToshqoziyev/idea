import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: {
            plan: {
              findMany: jest.fn(),
            },
            friendship: {
              findMany: jest.fn(),
            },
            progressUpdate: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return dashboard data', async () => {
    const userId = 'user-123';

    // Mocking prisma responses
    (prisma.plan.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.friendship.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.progressUpdate.findMany as jest.Mock).mockResolvedValue([]);

    const result = await service.getDashboard(userId);

    expect(result).toBeDefined();
    expect(result.active_plans).toEqual([]);
    expect(result.metrics.total_plans).toBe(0);
    expect(prisma.plan.findMany).toHaveBeenCalled();
  });
});
