
import * as fs from 'fs/promises';
import { CostTrackingService, CostEntry } from './costTrackingService';
import writeFileAtomic from 'write-file-atomic';
import type { Config } from '@/node/config';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('write-file-atomic');
jest.mock('@/node/services/log', () => ({
    log: {
        info: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock config
const mockConfig = {
    rootDir: '/test/root',
    loadConfigOrDefault: jest.fn().mockReturnValue({ customModelPrices: [] }),
} as unknown as Config;

describe('CostTrackingService', () => {
    let service: CostTrackingService;
    const mockFileContent = JSON.stringify({
        version: 1,
        entries: [],
        dailySummaries: {},
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default fs mock
        (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);
        (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
        service = new CostTrackingService(mockConfig);
    });

    it('should initialize correctly', () => {
        expect(service).toBeDefined();
    });

    describe('recordCost', () => {
        it('should read existing file, append entry, and write back', async () => {
            const entry: CostEntry = {
                timestamp: Date.now(),
                workspaceId: 'ws-1',
                model: 'claude-3-opus',
                inputTokens: 100,
                outputTokens: 50,
                cachedTokens: 0,
                cacheCreateTokens: 0,
                reasoningTokens: 0,
                cost: 0.05,
            };

            await service.recordCost(entry);

            expect(fs.readFile).toHaveBeenCalled();
            expect(writeFileAtomic).toHaveBeenCalled();

            const callArgs = (writeFileAtomic as unknown as jest.Mock).mock.calls[0];
            const writtenData = JSON.parse(callArgs[1] as string);

            expect(writtenData.entries).toHaveLength(1);
            expect(writtenData.entries[0]).toEqual(entry);

            // Should also update daily summary
            const today = new Date().toISOString().slice(0, 10);
            expect(writtenData.dailySummaries[today]).toBeDefined();
            expect(writtenData.dailySummaries[today].totalCost).toBe(0.05);
        });

        it('should handle read errors by initializing empty state', async () => {
            (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

            const entry: CostEntry = {
                timestamp: 1234567890,
                workspaceId: 'ws-1',
                model: 'test-model',
                inputTokens: 10,
                outputTokens: 10,
                cachedTokens: 0,
                cacheCreateTokens: 0,
                reasoningTokens: 0,
                cost: 0.01,
            };

            await service.recordCost(entry);

            // Should still write despite read error (creates new file)
            expect(writeFileAtomic).toHaveBeenCalled();
        });
    });

    describe('trackCost', () => {
        it('should calculate cost for known model and record it', async () => {
            const spyRecord = jest.spyOn(service, 'recordCost');

            // We are using a mock model 'gpt-4o' which should be resolved by createDisplayUsage
            // utilizing the real or default model stats if not mocked.
            // Since we can't easily mock createDisplayUsage without dependency injection or module mocking
            // and jest.mock works on module level, we'll assume standard behavior.

            await service.trackCost('ws-1', 'gpt-4o', {
                inputTokens: 100,
                outputTokens: 100,
            } as any);

            expect(spyRecord).toHaveBeenCalled();
            const args = spyRecord.mock.calls[0][0];
            expect(args.model).toBe('gpt-4o');
        });
    });

    describe('pruneOldEntries', () => {
        it('should remove entries older than retention period', async () => {
            const now = Date.now();
            const oldTime = now - (91 * 24 * 60 * 60 * 1000); // 91 days ago
            const newTime = now - (1 * 24 * 60 * 60 * 1000); // 1 day ago

            const mockData = {
                version: 1,
                entries: [
                    { timestamp: oldTime, cost: 1, model: 'old' },
                    { timestamp: newTime, cost: 2, model: 'new' },
                ],
                dailySummaries: {
                    [new Date(oldTime).toISOString().slice(0, 10)]: { totalCost: 1 },
                    [new Date(newTime).toISOString().slice(0, 10)]: { totalCost: 2 },
                }
            };

            (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

            const removedCount = await service.pruneOldEntries(90);

            expect(removedCount).toBe(1);
            expect(writeFileAtomic).toHaveBeenCalled();

            const callArgs = (writeFileAtomic as unknown as jest.Mock).mock.calls[0];
            const writtenData = JSON.parse(callArgs[1] as string);
            expect(writtenData.entries).toHaveLength(1);
            expect(writtenData.entries[0].model).toBe('new');
        });
    });
});
