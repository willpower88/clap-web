<template>
    <div class="login-wrap">
        <div class="ms-login">
            <div class="ms-title">后台管理系统</div>
            <el-form :model="ruleForm" :rules="rules" ref="ruleForm" label-width="0px" class="ms-content">
                <el-form-item prop="username">
                    <el-input v-model="ruleForm.username" placeholder="username">
                        <el-button slot="prepend" icon="el-icon-lx-people"></el-button>
                    </el-input>
                </el-form-item>
                <el-form-item prop="password">
                    <el-input type="password" placeholder="password" v-model="ruleForm.password" @keyup.enter.native="submitForm('ruleForm')">
                        <el-button slot="prepend" icon="el-icon-lx-lock"></el-button>
                    </el-input>
                </el-form-item>
                <div class="login-btn">
                    <el-button type="primary" @click="submitForm('ruleForm')">登录</el-button>
                </div>
                <p class="login-tips">Tips : 用户名和密码随便填。</p>
            </el-form>
        </div>
    </div>
</template>

<script>
    import {setCookie, getCookie} from '@/utils/cookie'
    export default {
        data: function(){
            return {
                ruleForm: {
                    username: 'admin',
                    password: 'admin'
                },
                rules: {
                    username: [
                        { required: true, message: '请输入用户名', trigger: 'blur' }
                    ],
                    password: [
                        { required: true, message: '请输入密码', trigger: 'blur' }
                    ]
                }
            }
        },
        methods: {
            submitForm(formName) {
                this.$refs[formName].validate((valid) =>{
                    if (valid) {
                        this.$axios({
                            method:'get',
                            url: this.NET.LOGIN_URL,
                            params: {
                                username : this.ruleForm.username,
                                password : this.ruleForm.password
                            }
                        }).then((response) => {
                            var code = response.data.status;
                            if(code == "200") {
                                console.log(response.data.data.roleList);
                                localStorage.setItem('ms_username', this.ruleForm.username);
                                localStorage.setItem('roleList', response.data.data.roleList);
                                localStorage.setItem('permissionList', response.data.data.permissionList);
                                this.$cookies.set('roleList', response.data.data.roleList);
                                console.log("login getCookie:" + this.$cookies.get("roleList"));
                                //setCookie('permissionList', response.data.data.permissionList);
                                this.$router.push('/');
                            } else {
                                document.getElementsByClassName("login-tips")[0].innerHTML ='<font color="red">' + response.data.message + '</font>';
                            }
                        }).catch((error) => {
                            console.log(error);
                            this.$router.push('/login');
                        });
                    } else {
                        console.log("error submit!!");
                        this.$router.push('/login');
                        return false;
                    }
                });
            }
        }
    }
</script>

<style scoped>
    .login-wrap{
        position: relative;
        width:100%;
        height:100%;
        background-image: url(../../assets/img/login-bg.jpg);
        background-size: 100%;
    }
    .ms-title{
        width:100%;
        line-height: 50px;
        text-align: center;
        font-size:20px;
        color: #fff;
        border-bottom: 1px solid #ddd;
    }
    .ms-login{
        position: absolute;
        left:50%;
        top:50%;
        width:350px;
        margin:-190px 0 0 -175px;
        border-radius: 5px;
        background: rgba(255,255,255, 0.3);
        overflow: hidden;
    }
    .ms-content{
        padding: 30px 30px;
    }
    .login-btn{
        text-align: center;
    }
    .login-btn button{
        width:100%;
        height:36px;
        margin-bottom: 10px;
    }
    .login-tips{
        font-size:12px;
        line-height:30px;
        color:#fff;
    }
</style>
