const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

function generateRandomFilename() {
  return uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] });
}

const filename = generateRandomFilename();

module.exports = filename;
