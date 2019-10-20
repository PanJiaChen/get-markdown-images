const commonMark = require('commonmark')

const getImgs = markdown => {
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

module.exports = {
  getImgs
}
