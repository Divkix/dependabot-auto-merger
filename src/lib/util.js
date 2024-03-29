const semverCoerce = require('semver/functions/coerce');
const semverValid = require('semver/functions/valid');
const log = require('./log');

/**
 * Checks if a version is a valid semver version.
 * Uses loose: true and replace `v`, `~`, `^` charactes to make function a bit
 * less restrictive regarding the accepted inputs
 * @param {String} version
 * @returns Boolean indicating whether version is valid
 */
function isValidSemver(version) {
  const isNumber = Number.isNaN(+version);

  if (isNumber) {
    return semverValid(semverCoerce(version));
  }

  return semverValid(version.replace(/[\^~v]/g, ''), { loose: true });
}

/**
 * Find the bump level of the PR
 * @param {String} oldVersion
 * @param {String} newVersion
 * @returns {String} bump level
 */
function findBumpLevel(oldVersion, newVersion) {
  if (oldVersion === newVersion) {
    return 'none';
  }

  if (semverCoerce(oldVersion).major === semverCoerce(newVersion).major) {
    if (semverCoerce(oldVersion).minor === semverCoerce(newVersion).minor) {
      return 'patch';
    }
    return 'minor';
  }
  return 'major';
}

/**
 * parse the pull request title to get the new version, old version and package name
 * @param {String} pullRequest;
 * @returns {Object} containing package name, old version, new version and bump level
 */
function parsePrTitle(pullRequest, context) {
  const expression = /^(bump|update) (\S+) (?:requirement )?from (\S+) to (\S+)$/gi;
  const match = expression.exec(pullRequest.title);

  if (!match) {
    log.error(
      context,
      'Error while parsing PR title, expected title: `bump|update <package> requirement  from <old-version> to <new-version>`'
      + `\nCurrent: ${pullRequest.title}`,
    );
  }

  // removing the first match because it is the whole string
  const [, , packageName, oldVersion, newVersion] = match.map((t) => t.replace(/`/g, ''));
  const isValid = isValidSemver(oldVersion) && isValidSemver(newVersion);

  return {
    packageName,
    oldVersion: isValid ? semverCoerce(oldVersion)?.raw : oldVersion,
    newVersion: isValid ? semverCoerce(newVersion)?.raw : newVersion,
    bumpLevel: findBumpLevel(oldVersion, newVersion),
  };
}

/**
 * function to match bump level settings
 * if bump level is minor, merge PRs with minor and patch bump
 * if bump level is major, only merge PRs with major, minor and patch bump
 * @param {String} bumpLevel
 * @param {String} configBumpLevel
 * @returns {Boolean}
 */
function matchBumpLevel(bumpLevel, config) {
  const majorArray = ['major', 'minor', 'patch'];
  const minorArray = ['minor', 'patch'];
  const patchArray = ['patch'];

  switch (config.merge_level) {
    case 'major':
      return majorArray.includes(bumpLevel);
    case 'minor':
      return minorArray.includes(bumpLevel);
    case 'patch':
      return patchArray.includes(bumpLevel);
    default:
      return false;
  }
}

module.exports = { parsePrTitle, matchBumpLevel };
