#!/usr/bin/env node

const { argv } = require('yargs')
const {downloadImages} = require('../lib/index.js')

console.log(argv)

downloadImages(argv)
