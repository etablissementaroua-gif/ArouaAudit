const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const files = {};
module.exports = { files, root, fs, path };
