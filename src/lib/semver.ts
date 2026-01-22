// Semver utility functions

export interface SemverVersion {
  major: number;
  minor: number;
  patch: number;
}

export function parseSemver(version: string): SemverVersion | null {
  const regex = /^(\d+)\.(\d+)\.(\d+)$/;
  const match = version.match(regex);
  
  if (!match) {
    return null;
  }
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

export function stringifySemver(version: SemverVersion): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

export function bumpVersion(
  currentVersion: string,
  bumpType: 'major' | 'minor' | 'patch'
): string | null {
  const parsed = parseSemver(currentVersion);
  
  if (!parsed) {
    return null;
  }
  
  const newVersion = { ...parsed };
  
  switch (bumpType) {
    case 'major':
      newVersion.major += 1;
      newVersion.minor = 0;
      newVersion.patch = 0;
      break;
    case 'minor':
      newVersion.minor += 1;
      newVersion.patch = 0;
      break;
    case 'patch':
      newVersion.patch += 1;
      break;
  }
  
  return stringifySemver(newVersion);
}

export function compareSemver(a: string, b: string): number {
  const parsedA = parseSemver(a);
  const parsedB = parseSemver(b);
  
  if (!parsedA || !parsedB) {
    throw new Error('Invalid semver format');
  }
  
  if (parsedA.major !== parsedB.major) {
    return parsedA.major - parsedB.major;
  }
  
  if (parsedA.minor !== parsedB.minor) {
    return parsedA.minor - parsedB.minor;
  }
  
  return parsedA.patch - parsedB.patch;
}

export function isValidSemver(version: string): boolean {
  return parseSemver(version) !== null;
}

export function sortVersionsDescending(versions: string[]): string[] {
  return [...versions].sort((a, b) => compareSemver(b, a));
}

export function getLatestVersion(versions: string[]): string | null {
  if (versions.length === 0) {
    return null;
  }
  
  return sortVersionsDescending(versions)[0];
}
