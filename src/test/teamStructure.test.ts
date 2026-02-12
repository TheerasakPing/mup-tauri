import { describe, it, expect } from 'vitest';
import {
  TEAM_MEMBERS,
  TEAM_CATEGORIES,
  getMembersByCategory,
  getMemberById,
  getTotalTeamSize,
} from '../data/teamStructure';

describe('teamStructure.ts', () => {
  it('should export required constants', () => {
    expect(TEAM_MEMBERS).toBeDefined();
    expect(TEAM_CATEGORIES).toBeDefined();
    expect(getMembersByCategory).toBeInstanceOf(Function);
    expect(getMemberById).toBeInstanceOf(Function);
    expect(getTotalTeamSize).toBeInstanceOf(Function);
  });

  it('should have 21 total members', () => {
    expect(getTotalTeamSize()).toBe(21);
  });

  it('should have 6 categories', () => {
    expect(TEAM_CATEGORIES).toHaveLength(6);
  });

  describe('getTotalTeamSize', () => {
    it('should return 21', () => {
      expect(getTotalTeamSize()).toBe(21);
    });
  });

  describe('getMembersByCategory', () => {
    it('should return development team with 10 members', () => {
      const members = getMembersByCategory('development');
      expect(members).toHaveLength(10);
      members.forEach((m) => expect(m.category).toBe('development'));
    });

    it('should return devops team with 1 member', () => {
      const members = getMembersByCategory('devops');
      expect(members).toHaveLength(1);
      expect(members[0].id).toBe('devops-1');
    });

    it('should return qa-qc team with 3 members', () => {
      const members = getMembersByCategory('qa-qc');
      expect(members).toHaveLength(3);
    });

    it('should return management team with 2 members', () => {
      const members = getMembersByCategory('management');
      expect(members).toHaveLength(2);
    });

    it('should return design team with 1 member', () => {
      const members = getMembersByCategory('design');
      expect(members).toHaveLength(1);
    });

    it('should return support team with 4 members', () => {
      const members = getMembersByCategory('support');
      expect(members).toHaveLength(4);
    });

    it('should return empty array for invalid category', () => {
      const members = getMembersByCategory('invalid' as any);
      expect(members).toEqual([]);
    });
  });

  describe('getMemberById', () => {
    it('should find dev-frontend-1', () => {
      const member = getMemberById('dev-frontend-1');
      expect(member).toBeDefined();
      expect(member?.id).toBe('dev-frontend-1');
      expect(member?.titleEnglish).toBe('Frontend Developer #1');
    });

    it('should return undefined for non-existent ID', () => {
      const member = getMemberById('does-not-exist');
      expect(member).toBeUndefined();
    });

    it('should find all member IDs', () => {
      const ids = TEAM_MEMBERS.map((m: any) => m.id);
      ids.forEach((id) => {
        const member = getMemberById(id);
        expect(member).toBeDefined();
        expect(member?.id).toBe(id);
      });
    });
  });
});
