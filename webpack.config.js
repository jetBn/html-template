const path = require("path")
const HtmlWebPackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")
const PreloadWebpackPlugin = require("preload-webpack-plugin")
const CssUrlRelativePlugin = require("css-url-relative-plugin")
const utils = require("./utils/main")
const webpack = require('webpack')

const IS_DEV = process.env.NODE_ENV === 'dev' // 判断是否为开发环境
const HTMLDirs = utils.readFiles('./src/page')  //读取src下page目录下的html文件
let Entries = {}
let HTMLPlugins = []

    HTMLDirs.forEach(page => {
        let repPage = page.replace(/\.html$/i, '')
        const htmlPlugin = new HtmlWebPackPlugin({
        filename: page,
        template: path.resolve(__dirname, `./src/page/${page}`),
        chunks: utils.checkJs(repPage) ? [repPage, "commons", "jq"]:["commons", "jq"], //引入的模块，entry中设置多个js时，在这里引入指定的js，如果不设置则全部引入
        minify: !IS_DEV && {
            collapseWhitespace: false, //清楚空格、换行符
            preserveLineBreaks: true, //保留换行符
            removeComments: true //清理html中的注释
        }
    });
        HTMLPlugins.push(htmlPlugin);
        utils.checkJs(repPage) && (Entries[repPage] = path.resolve(__dirname, `./src/js/${repPage}.js`))
        Entries.commons = path.resolve(__dirname, `./src/js/commons.js`) // 不需要手动引入但是 在打包后重置样式 比如写的公共样式写到同css里
    });



module.exports = {
    entry: Entries,
    output: {
        filename: IS_DEV ? "js/[name].[hash:8].js" : "js/[name].[chunkhash:8].js",
        path: path.resolve(__dirname, "dist"),
        publicPath: "/"
    },
    module: {
        rules:[
            {
               test: /\.js$/,
               exclude: /node_modules/,
               use: {
                   loader: "babel-loader"
               }
            },
            {
                test:/\.(sc|c)ss$/,
                use:[ 
                    IS_DEV ? "style-loader" : MiniCssExtractPlugin.loader, //如果是开发模式使用内嵌样式
                    "css-loader",
                    "sass-loader"
                ]
            },
            /*打包完成后需要手动引入*/
           /* {
                test:/\.css$/,
                use:[
                    "style-loader",
                    IS_DEV ? "css-loader":
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].css',
                            outputPath: 'css'
                        },
                    },
                ],
            },*/
            {
                test:/\.(htm|html)$/i,
                use: ["html-withimg-loader"]
            },
            {
                test: /\.(gif|png|jpe?g|svg)$/i,
                use: [
                        {
                            loader: "url-loader",
                            options: {
                                limit: 1, // 数值越大会进行base64
                                name: "[name].[ext]",
                                fallback: "file-loader", //超过了限制大小调用回调函数
                                outputPath: "public/images" //图片存储的地址
                            }
                        }
                    ]
            }
        ],
    },
    devServer: {
        contentBase: path.join(__dirname, "../src"),
        hot: true
    },
   /* externals: {
        $: "jQuery"
    },*/  // 配置在页面中引入的 但又不想被打包的 比如cdn引入的
    
    /*配置打包公共的css js*/
    optimization: {
        splitChunks: {
            cacheGroups: {
                //打包公共模块
                jq: {
                    test:/\.js$/,
                    chunks: 'all', //initial表示提取入口文件的公共部分
                    minChunks: 1, //表示提取公共部分最少的文件数
                    minSize: 0, //表示提取公共部分最小的大小
                    name: 'jq' //提取出来的文件命名
                }
            }
        }
    },
    plugins:[
        ...HTMLPlugins,
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: !IS_DEV ? "css/[name].[contenthash:8].css" : "[name].css",
            chunkFilename: !IS_DEV ? "css/[name].[contenthash:8].css" : "[name].css",
            allChunks: true
        }),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery"
          }), //自动加载模块，当在项目中遇见$、jQuery、会自动加载JQUERY模块
        new CopyWebpackPlugin([
            //将单个文件或整个目录复制到构建目录。
            {
              from: "./src/public",
              to: "public"
            }
          ]),
        // new PreloadWebpackPlugin({
        //     include: "initial"
        //   }), 
        new CssUrlRelativePlugin(),
        new webpack.HotModuleReplacementPlugin()
    ]
}
