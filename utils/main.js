const fs = require("fs")

module.exports = {
    checkJs(name){
        const files = fs.readdirSync('./src/js')
        let index = name.lastIndexOf("\/")
        let checkName = name.substring(index + 1, name.length)
        return files.includes(`${checkName}.js`)
    },
    readFiles(path = "./src/page", res = [], dir = ''){
        const self = this
        const files = fs.readdirSync(path)
        files.forEach((item)=> {
            let info = fs.statSync(`${path}/${item}`)
            info.isDirectory() ? self.readFiles(`${path}/${item}`, res, item) : dir !== '' ? res.push(`${dir}/${item}`) : res.push(item)
        })
        return res
    }
}