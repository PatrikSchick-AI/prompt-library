import { describe, it, expect } from 'vitest';
import {
  parseSemver,
  stringifySemver,
  bumpVersion,
  compareSemver,
  isValidSemver,
  sortVersionsDescending,
  getLatestVersion,
} from './semver';

describe('semver utilities', () => {
  describe('parseSemver', () => {
    it('should parse valid semver strings', () => {
      expect(parseSemver('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 });
      expect(parseSemver('0.0.0')).toEqual({ major: 0, minor: 0, patch: 0 });
      expect(parseSemver('10.20.30')).toEqual({ major: 10, minor: 20, patch: 30 });
    });

    it('should return null for invalid semver strings', () => {
      expect(parseSemver('1.2')).toBeNull();
      expect(parseSemver('1.2.3.4')).toBeNull();
      expect(parseSemver('abc')).toBeNull();
      expect(parseSemver('1.2.x')).toBeNull();
    });
  });

  describe('stringifySemver', () => {
    it('should convert version object to string', () => {
      expect(stringifySemver({ major: 1, minor: 2, patch: 3 })).toBe('1.2.3');
      expect(stringifySemver({ major: 0, minor: 0, patch: 0 })).toBe('0.0.0');
    });
  });

  describe('bumpVersion', () => {
    it('should bump major version', () => {
      expect(bumpVersion('1.2.3', 'major')).toBe('2.0.0');
      expect(bumpVersion('0.5.10', 'major')).toBe('1.0.0');
    });

    it('should bump minor version', () => {
      expect(bumpVersion('1.2.3', 'minor')).toBe('1.3.0');
      expect(bumpVersion('1.0.5', 'minor')).toBe('1.1.0');
    });

    it('should bump patch version', () => {
      expect(bumpVersion('1.2.3', 'patch')).toBe('1.2.4');
      expect(bumpVersion('1.2.0', 'patch')).toBe('1.2.1');
    });

    it('should return null for invalid version', () => {
      expect(bumpVersion('invalid', 'patch')).toBeNull();
    });
  });

  describe('compareSemver', () => {
    it('should compare major versions', () => {
      expect(compareSemver('2.0.0', '1.0.0')).toBeGreaterThan(0);
      expect(compareSemver('1.0.0', '2.0.0')).toBeLessThan(0);
    });

    it('should compare minor versions', () => {
      expect(compareSemver('1.2.0', '1.1.0')).toBeGreaterThan(0);
      expect(compareSemver('1.1.0', '1.2.0')).toBeLessThan(0);
    });

    it('should compare patch versions', () => {
      expect(compareSemver('1.1.2', '1.1.1')).toBeGreaterThan(0);
      expect(compareSemver('1.1.1', '1.1.2')).toBeLessThan(0);
    });

    it('should return 0 for equal versions', () => {
      expect(compareSemver('1.2.3', '1.2.3')).toBe(0);
    });

    it('should throw for invalid versions', () => {
      expect(() => compareSemver('invalid', '1.0.0')).toThrow();
      expect(() => compareSemver('1.0.0', 'invalid')).toThrow();
    });
  });

  describe('isValidSemver', () => {
    it('should validate semver strings', () => {
      expect(isValidSemver('1.2.3')).toBe(true);
      expect(isValidSemver('0.0.0')).toBe(true);
      expect(isValidSemver('invalid')).toBe(false);
      expect(isValidSemver('1.2')).toBe(false);
    });
  });

  describe('sortVersionsDescending', () => {
    it('should sort versions in descending order', () => {
      const versions = ['1.0.0', '2.0.0', '1.5.0', '1.0.1'];
      expect(sortVersionsDescending(versions)).toEqual([
        '2.0.0',
        '1.5.0',
        '1.0.1',
        '1.0.0',
      ]);
    });
  });

  describe('getLatestVersion', () => {
    it('should return the latest version', () => {
      expect(getLatestVersion(['1.0.0', '2.0.0', '1.5.0'])).toBe('2.0.0');
      expect(getLatestVersion(['0.1.0', '0.2.0', '0.1.5'])).toBe('0.2.0');
    });

    it('should return null for empty array', () => {
      expect(getLatestVersion([])).toBeNull();
    });
  });
});
