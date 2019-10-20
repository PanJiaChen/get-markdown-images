const fs = require('fs')
const axios = require('axios')

const {
  validURL
} = require('./validate')

module.exports = class Download {
  constructor(outputDir) {
    this.outputDir = outputDir
  }

  save(url, dir) {
    return new Promise((resolve, reject) => {

      if (!validURL(url)) {
        setTimeout(() => { // fake
          reject({
            dir: dir,
            url: url
          })
        }, 1000);


      } else {
        const s = url.split('/')
        const name = s[s.length - 1] || 'undefined'
        const writer = fs.createWriteStream(`${this.outputDir}/${name}`)

        axios({
          url,
          method: 'GET',
          responseType: 'stream',
        }).then(response => {
          writer.on('error', err => {
            err.dir = dir
            reject(err)
          })
          writer.on('finish', () => {
            resolve()
          })
          response.data.pipe(writer)
        }).catch(err => {
          err.dir = dir
          reject(err)
        })
      }
    })
  }
}
