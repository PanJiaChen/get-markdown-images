const fs = require('fs')
const path = require('path')
const axios = require('axios')
const mkdirp = require('mkdirp')
const glob = require('glob')
const commonMark = require('commonmark')
const Listr = require('listr')
const Table = require('cli-table')
const chalk = require('chalk')

const defaultConfig = require('./defaultConfig')
const allSettled = require('./allSettled.js')
const Download = require('./download.js')
const download = new Download(outputDir)


const getAllImg = markdown => {
  if (!markdown) return
  const parsed = new commonMark.Parser().parse(markdown)
  const walker = parsed.walker()
  let event
  const nodeList = []
  while ((event = walker.next())) {
    const node = event.node
    if (node.type === 'image' && node.destination) {
      nodeList.push(node)
    }
  }
  const list = nodeList.map(node => node.destination)
  const uniqueSrcList = [...new Set(list)]

  return {
    list,
    uniqueSrcList,
    nodeList
  }
}

const readFile = file => {
  return new Promise((resolve, reject) => {
    const dirPath = file

    fs.readFile(dirPath, 'utf8', (err, data) => {
      if (err) {
        reject(err)
      }

      const images = getAllImg(data)
      if (images) {
        setTimeout(() => resolve(images.uniqueSrcList), 2000)
      }
    })
  })
}

async function downloadImages(config) {
  config = Object.assign(defaultConfig, config)
  const {
    outputDir,
    inputDir
  } = config

  mkdirp(outputDir, function (err) {
    if (err) {
      console.log(err)
    }
  })


  try {
    glob(
      '**/*.md', {
        cwd: path.resolve(process.cwd(), inputDir)
      },
      async function (er, files) {
        let success = 0
        const errorArr = []

        const tasksList = files.map(file => {
          return {
            title: file,
            task: () => {
              return new Promise((resolve, reject) => {
                try {
                  const dir = `${inputDir}/${file}`
                  readFile(dir).then(async data => {
                    const promises = []
                    for (const url of data) {
                      promises.push(download.save(url))
                    }
                    allSettled(promises).then(results => {
                      results.forEach(result => {
                        const {
                          status
                        } = result
                        if (status === 'fulfilled') {
                          success++
                        } else {
                          errorArr.push({
                            file: dir,
                            url: result.reason.config.url
                          })
                          // console.log(result)
                        }
                      })
                      resolve(file)
                    })
                  })
                } catch (error) {
                  reject(error)
                  throw new Error(error)
                }
              })
            }
          }
        })

        const tasks = new Listr(tasksList, {
          exitOnError: false,
          concurrent: true
          // renderer: "verbose"
        })

        tasks.run().then(() => {
          console.log(chalk.greenBright(`Success download images: ${success}`))
          console.log(
            chalk.redBright(`Error download images: ${errorArr.length}`)
          )

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
    )
  } catch (error) {
    console.log(error)
  }
}





module.exports = {
  downloadImages,
}
