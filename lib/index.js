const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const glob = require('glob')
const ora = require('ora');
const Table = require('cli-table3')
const chalk = require('chalk')

const defaultConfig = require('./default-config')
const allSettled = require('./all-settled.js')
const Download = require('./download.js')
const parser = require('./parser-md')

const downloadSpinner = ora({
  text: 'Downloading images',
  spinner: {
    "interval": 100,
    "frames": [
      "🙈 ",
      "🙈 ",
      "🙉 ",
      "🙊 "
    ]
  }
})

const readFile = file => {
  return new Promise((resolve, reject) => {
    const dirPath = file

    fs.readFile(dirPath, 'utf8', (err, data) => {
      if (err) {
        reject(err)
      }
      const images = parser.getImgs(data)
      if (images) {
        resolve(images.uniqueSrcList)
      }
    })
  })
}


const findAllMd = inputDir => {
  return new Promise((resolve, reject) => {
    glob(
      '**/*.md', {
        cwd: path.resolve(process.cwd(), inputDir)
      },
      function (er, files) {
        if (er) {
          reject(err)
        }
        resolve(files)
      })
  })

}

async function downloadImages(config) {

  config = Object.assign(defaultConfig, config)
  const {
    outputDir,
    inputDir
  } = config


  // check params
  if (!inputDir) {
    const text = 'inputDir is required'
    console.log(chalk.redBright(text))
    throw Error(text)
  }

  // create folder
  mkdirp(outputDir, function (err) {
    if (err) {
      throw Error(text)
    }
  })

  // get all md from inputDir
  const files = await findAllMd(inputDir)

  let success = 0
  const errorArr = []
  const promises = []

  const download = new Download(outputDir)


  for (let index = 0; index < files.length; index++) {

    const file = files[index];
    const fileSpinner = ora(file).start()
    const dir = `${inputDir}/${file}`
    const data = await readFile(dir)

    for (const url of data) {
      promises.push(download.save(url, dir))
    }
    fileSpinner.succeed()
  }


  downloadSpinner.start()

  allSettled(promises).then(results => {
    downloadSpinner.stop()
    results.forEach(result => {
      const {
        status,
        reason,
      } = result

      if (status === 'fulfilled') {
        success++
      } else {
        errorArr.push({
          file: reason.dir || reason.config.headers['X-DIR'],
          url: reason.url || reason.config.url
        })
      }
    })

    console.log(chalk.greenBright(`Success download images: ${success}`))
    console.log(chalk.redBright(`Error download images: ${errorArr.length}`))

    if (errorArr.length > 0) {
      const table = new Table({
        head: ['File', 'Url']
      })

      errorArr.forEach(e => {
        table.push([e.file || '', e.url || ''])
      })

      console.log(table.toString())
    }
  })
}

process.on('unhandledRejection', () => {});

module.exports = {
  downloadImages
}
