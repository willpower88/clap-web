import Vue from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css'; // 默认主题
// import '../static/css/theme-green/index.css';       // 浅绿色主题
import './assets/css/icon.css';
import './components/common/directives';
import "babel-polyfill";
import {setCookie, getCookie} from './utils/cookie'
import qa from 'qs'

import VueCookies from 'vue-cookies'
Vue.use(VueCookies)

//开启debug
Vue.config.debug = true;
Vue.config.productionTip = false;
Vue.use(ElementUI, {
    size: 'small'
});
//设置baseURL
axios.defaults.baseURL = 'http://localhost:8080';
//每个请求都带session信息
axios.defaults.withCredentials = true;
//请求头
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
Vue.prototype.$axios = axios;

//使用钩子函数对路由进行权限跳转
router.beforeEach((to, from, next) => {
    const role = localStorage.getItem('ms_username');
    const roleList = localStorage.getItem("roleList");
    const permissionList = localStorage.getItem("permissionList");
    let cookieRoleList = getCookie("roleList");
    if (!cookieRoleList && to.path !== '/login') {
        next('/login');
    } else if (to.meta.permission) {
        // 如果是管理员权限则可进入，这里只是简单的模拟管理员权限而已
        roleList.indexOf('admin') > -1 ? next() : next('/403');
    } else {
        // 简单的判断IE10及以下不进入富文本编辑器，该组件不兼容
        if (navigator.userAgent.indexOf('MSIE') > -1 && to.path === '/editor') {
            Vue.prototype.$alert('vue-quill-editor组件不兼容IE10及以下浏览器，请使用更高版本的浏览器查看', '浏览器不兼容通知', {
                confirmButtonText: '确定'
            });
        } else {
            next();
        }
    }
})

axios.interceptors.request.use(
    config => {
        config.baseURL = '/api/';
        config.withCredentials = true; // 允许携带token ,这个是解决跨域产生的相关问题
        config.timeout = 2500;
        let token = sessionStorage.getItem('JSESSIONID');
        if (token) {
            config.headers = {
                'access-token': token,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
        if (config.url === 'refresh') {
            config.headers = {
                'refresh-token': sessionStorage.getItem('refresh_token'),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
)

//network err interceptor
axios.interceptors.response.use(function(response) {
    return response;
},function(error) {
    router.push({
        path: '/login'
    })
})

new Vue({
    router,
    render: h => h(App)
}).$mount('#app')
