module.exports = class Download {
  constructor(outputDir) {
    this.outputDir=outputDir
  }

  save(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const s = url.split('/')
        const name = s[s.length - 1]
        const writer = fs.createWriteStream(`${this.outputDir}/${name}`)

        const response = await axios({
          url,
          method: 'GET',
          responseType: 'stream'
        })

        response.data.pipe(writer)
        writer.on('finish', resolve)
        writer.on('error', reject)
      } catch (error) {
        reject(error)
      }
    })
  }
}
