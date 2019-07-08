module.exports = {
    baseUrl: './',
    productionSourceMap: false,
    devServer: {
        proxy: {
            '/api':{
                target:'http://localhost:8080',
                changeOrigin:true,
                pathRewrite:{
                    '^/api':''
                }
            },
            '/ms':{
                target: 'http://localhost:8080',
                changeOrigin: true
            }
        }
    }
}
