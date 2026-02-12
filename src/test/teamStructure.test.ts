import { describe, it, expect } from 'vitest';
import {
  TEAM_MEMBERS,
  TEAM_CATEGORIES,
  getMembersByCategory,
  getMemberById,
  getTotalTeamSize,
} from '../data/teamStructure';

describe('Team Structure Tests', () => {
  describe('Team Categories', () => {
    it('should have 6 categories', () => {
      expect(TEAM_CATEGORIES).toHaveLength(6);
    });

    it('should have all required category IDs', () => {
      const categoryIds = TEAM_CATEGORIES.map((c: any) => c.id);
      const expectedIds = ['development', 'devops', 'qa-qc', 'management', 'design', 'support'];
      expectedIds.forEach((id: string) => expect(categoryIds).toContain(id));
    });
  });

  describe('Team Members', () => {
    it('should have exactly 21 team members', () => {
      expect(TEAM_MEMBERS).toHaveLength(21);
    });

    it('should have unique IDs', () => {
      const ids = TEAM_MEMBERS.map((m: any) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(21);
    });

    it('should have required properties for each member', () => {
      TEAM_MEMBERS.forEach((member: any) => {
        expect(member).toHaveProperty('id');
        expect(member).toHaveProperty('titleThai');
        expect(member).toHaveProperty('titleEnglish');
        expect(member).toHaveProperty('category');
        expect(member).toHaveProperty('responsibilities');
        expect(member).toHaveProperty('skills');
        expect(member).toHaveProperty('tools');
        expect(member).toHaveProperty('icon');
      });
    });
  });

  describe('Team Distribution', () => {
    it('should have 10 development members', () => {
      const devTeam = getMembersByCategory('development');
      expect(devTeam).toHaveLength(10);
    });

    it('should have 1 devops member', () => {
      const devopsTeam = getMembersByCategory('devops');
      expect(devopsTeam).toHaveLength(1);
    });

    it('should have 3 QA/QC members', () => {
      const qaTeam = getMembersByCategory('qa-qc');
      expect(qaTeam).toHaveLength(3);
    });

    it('should have 2 management members', () => {
      const mgmtTeam = getMembersByCategory('management');
      expect(mgmtTeam).toHaveLength(2);
    });

    it('should have 1 design member', () => {
      const designTeam = getMembersByCategory('design');
      expect(designTeam).toHaveLength(1);
    });

    it('should have 4 support members', () => {
      const supportTeam = getMembersByCategory('support');
      expect(supportTeam).toHaveLength(4);
    });
  });

  describe('Helper Functions', () => {
    it('getTotalTeamSize should return 21', () => {
      expect(getTotalTeamSize()).toBe(21);
    });

    it('getMemberById should find valid member', () => {
      const member = getMemberById('dev-frontend-1');
      expect(member).toBeDefined();
      expect(member?.id).toBe('dev-frontend-1');
    });

    it('getMemberById should return undefined for invalid ID', () => {
      const member = getMemberById('invalid-id');
      expect(member).toBeUndefined();
    });
  });
});
