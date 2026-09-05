'use strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv/dist/2020');

const schemaPath = path.join(__dirname, '..', 'schema', 'release-schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
const validate = ajv.compile(schema);

/**
 * Formats ajv error objects into readable strings.
 * @param {import('ajv').ErrorObject[]} errors
 * @returns {string[]}
 */
function formatErrors(errors) {
  return (errors || []).map((err) => {
    const instancePath = err.instancePath || '(root)';
    return `${instancePath} ${err.message}`.trim();
  });
}

/**
 * Validates a release spec object against the JSON schema.
 * @param {unknown} releaseSpec
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateReleaseSpec(releaseSpec) {
  const valid = validate(releaseSpec);
  return { valid: Boolean(valid), errors: formatErrors(validate.errors) };
}

/**
 * Loads and validates a release spec JSON file from disk.
 * @param {string} filePath Path to a release spec JSON file.
 * @returns {object} The parsed release spec.
 * @throws {Error} If the file cannot be read, parsed, or fails validation.
 */
function loadReleaseSpec(filePath) {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');

  let releaseSpec;
  try {
    releaseSpec = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse release spec JSON at ${absolutePath}: ${err.message}`);
  }

  const { valid, errors } = validateReleaseSpec(releaseSpec);
  if (!valid) {
    throw new Error(
      `Release spec at ${absolutePath} failed validation:\n${errors.map((e) => `  - ${e}`).join('\n')}`
    );
  }

  return releaseSpec;
}

module.exports = { loadReleaseSpec, validateReleaseSpec, schema };
