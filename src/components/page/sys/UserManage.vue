<template>
<div class="table">
    <div class="crumbs">
        <el-breadcrumb separator="/">
            <el-breadcrumb-item><i class="el-icon-lx-cascades"></i> 用户管理</el-breadcrumb-item>
        </el-breadcrumb>
    </div>
    <div class="container">
        <div class="handle-box">
            <el-button type="primary" icon="el-icon-delete" class="handle-del mr10" @click="delAll">批量删除</el-button>
            <el-button type="primary" icon="el-icon-edit" class="handle-del mr10" @click="handleUser">新增用户</el-button>
            <el-input v-model="select_word" placeholder="筛选关键词" class="handle-input mr10"></el-input>
            <el-button type="primary" icon="search" @click="search">搜索</el-button>
        </div>
        <el-table :data="data" border class="table" ref="multipleTable" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center"></el-table-column>
            <el-table-column prop="uid" label="用户ID" sortable width="150">
            </el-table-column>
            <el-table-column prop="username" label="登录名" width="120">
            </el-table-column>
            <el-table-column prop="name" label="用户名" width="120">
            </el-table-column>
            <el-table-column prop="state" label="状态" :formatter="formatter">
            </el-table-column>
            <el-table-column label="操作" align="center">
                <template slot-scope="scope">
                        <el-button type="text" icon="el-icon-edit" @click="handleEdit(scope.$index, scope.row)">编辑</el-button>
                        <el-button type="text" icon="el-icon-check" @click="handleAllotRole(scope.$index, scope.row)">分配角色</el-button>
                        <el-button type="text" icon="el-icon-delete" class="red" @click="handleDelete(scope.$index, scope.row)">删除</el-button>
                    </template>
            </el-table-column>
        </el-table>
        <div class="pagination">
            <el-pagination background @current-change="handleCurrentChange" layout="total, sizes, prev, pager, next" :total="totalCount" :page-size="pageSize" :page-sizes="[5, 10, 15, 20]">
            </el-pagination>
        </div>
    </div>

    <!-- 编辑弹出框 -->
    <el-dialog :title="dialogTitle" :visible.sync="editVisible" width="30%">
        <el-form ref="form" :model="form" label-width="100px">
            <el-input type="hidden" v-model="form.uid"></el-input>
            <el-form-item label="登录用户名">
                <el-input v-model="form.username"></el-input>
            </el-form-item>
            <el-form-item label="用户名称">
                <el-input v-model="form.name"></el-input>
            </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
                <el-button @click="editVisible = false">取 消</el-button>
                <el-button type="primary" @click="saveUser">保 存</el-button>
            </span>
    </el-dialog>
    <!-- 分配角色  -->
    <el-dialog :title="dialogTitle" :visible.sync="allotRoleVisible" width="30%">
        <el-form ref="form" :model="form" label-width="100px">
            <el-input type="hidden" v-model="form.uid"></el-input>
            <el-checkbox-group v-model="checkRole">
                <el-checkbox v-for="(item, index) in roleData" :key="item.role" :label="item.role">{{ item.description }}</el-checkbox>
            </el-checkbox-group>
        </el-form>

        <span slot="footer" class="dialog-footer">
                <el-button @click="allotRoleVisible = false">取 消</el-button>
                <el-button type="primary" @click="saveAllotRole">保 存</el-button>
            </span>
    </el-dialog>


    <!-- 删除提示框 -->
    <el-dialog title="提示" :visible.sync="delVisible" width="300px" center>
        <div class="del-dialog-cnt">删除不可恢复，是否确定删除？</div>
        <span slot="footer" class="dialog-footer">
                <el-button @click="delVisible = false">取 消</el-button>
                <el-button type="primary" @click="deleteRow">确 定</el-button>
            </span>
    </el-dialog>
</div>
</template>

<script>
export default {
    name: 'basetable',
    data() {
        return {
            url: './vuetable.json',
            tableData: [],
            roleData: [],
            roleData1: [],
            checkRole: ['admin', 'vip'],
            cur_page: 1,
            totalCount: 100,
            pageSize: 5,
            select_cate: '',
            select_word: '',
            del_list: [],
            allotRoleList: [],
            multipleSelection: [],
            is_search: false,
            editVisible: false,
            delVisible: false,
            allotRoleVisible: false,
            dialogTitle: '',
            form: {
                uid: '',
                name: '',
                username: '',
                password: '',
                role: '',
            },
            idx: -1
        }
    },
    created() {
        this.getData();
    },
    updated() {
    },
    mounted() {
      //do something after mounting vue instance

    },
    computed: {
        data() {
            return this.tableData.filter((d) => {
                let is_del = false;
                for (let i = 0; i < this.del_list.length; i++) {
                    if (d.name === this.del_list[i].name) {
                        is_del = true;
                        break;
                    }
                }
                if (!is_del) {
                    if (d.name.indexOf(this.select_cate) > -1 &&
                        (d.username.indexOf(this.select_word) > -1 ||
                            d.name.indexOf(this.select_word) > -1)
                    ) {
                        return d;
                    }
                }
            })
        }
    },
    methods: {
        // 分页导航
        handleCurrentChange(val) {
            this.cur_page = val;
            this.getData();
        },
        // 获取 easy-mock 的模拟数据
        getData() {
            // 开发环境使用 easy-mock 数据，正式环境使用 json 文件
            if (process.env.NODE_ENV === 'development') {
                this.url = '/ms/table/list';
            };
            this.$axios.get(this.NET.USER_ALL_URL, {
                params: {
                    pageNum: this.cur_page,
                    pageSize: 5
                }
            }).then((res) => {
                this.tableData = res.data.data,
                this.pageSize = res.data.pageInfo.pageSize,
                this.totalCount = res.data.pageInfo.total
            })
        },
        search() {
            this.is_search = true;
        },
        formatter(row, column) {
            if (row.available == true) {
                return "有效";
            } else {
                return "无效";
            }
        },
        roleFormatter(row, column) {
            var result = "";
            var len = row.sysRoleList.length;
            for (var i = 0; i < len; i++) {
                result += row.sysRoleList[i].description + ",";
            }
            result = result.substr(0, result.length - 1);
            return result;
        },
        filterTag(value, row) {
            return row.tag === value;
        },
        handleEdit(index, row) {
            this.idx = index;
            this.dialogTitle = "编辑用户"
            const item = this.tableData[index];
            this.form = {
                uid: item.uid,
                username: item.username,
                name: item.name,
            }
            this.editVisible = true;
        },
        handleDelete(index, row) {
            this.idx = index;
            this.delVisible = true;

            let url = this.NET.USER_DEL_URL + "/" + row.uid;
            this.$axios.get(url).then((res) => {
                if(res.data.status == 200) {
                    this.$message.success("用户已删除");
                } else {
                    this.$message.error(res.data.message);
                }
            })
        },
        delAll() {
            const length = this.multipleSelection.length;
            let str = '';
            this.del_list = this.del_list.concat(this.multipleSelection);
            for (let i = 0; i < length; i++) {
                str += this.multipleSelection[i].name + ' ';
            }
            this.$message.error('删除了' + str);
            this.multipleSelection = [];
        },
        handleUser() {
            this.dialogTitle = "新增用户";
            this.form = {
                uid: '',
                username: '',
                name: '',
            }
            this.editVisible = true;
        },
        handleSelectionChange(val) {
            this.multipleSelection = val;
        },
        //分配角色
        handleAllotRole(index, row) {
            this.dialogTitle = "分配角色";
            this.checkRole = [];
            this.form.uid = row.uid;
            //获取所有角色
            this.$axios.get(this.NET.ROLE_ALL_URL, {
                params: {
                    pageNum: this.cur_page,
                    pageSize: 100
                }
            }).then((res) => {
                this.roleData = res.data.data
            })
            //获取已分配角色
            let url = this.NET.ROLE_USER_URL + "/" + row.uid;
            this.$axios.get(url).then((res) => {
                this.allotRoleList = res.data.data;
            })
            //访问后端用户较长，计算已分配角色延时处理,延迟100ms
            setTimeout(() => {
                let arr = [];
                let selectData = [];
                this.roleData.forEach(item => {
                    this.allotRoleList.indexOf(item)
                    this.allotRoleList.forEach(item1 => {
                        if(item.id == item1.roleId) {
                            arr.push(item.role);
                        }
                    })
                })

                this.checkRole = arr;
                if(this.checkRole.length > 0) {
                    this.allotRoleVisible = true;
                }
            }, 100);
        },
        // 保存编辑
        saveEdit() {
            this.$set(this.tableData, this.idx, this.form);
            this.editVisible = false;
            this.$message.success(`修改第 ${this.idx+1} 行成功`);
        },
        //保存分配的角色
        saveAllotRole() {
            let roleIds = [];
            //转为roleId
            this.roleData.forEach(item => {
                this.checkRole.forEach(item1 => {
                    if(item.role == item1) {
                        roleIds.push(item.id);
                    }
                })
            })
            console.log(roleIds);
            let reqData = JSON.stringify({
                uid: this.form.uid,
                roleIds: roleIds,
            })

            this.$axios.post(this.NET.ROLE_ALLOT_URL, reqData, {
                headers: {
                    "Content-Type": "application/json;chareset=utf-8"
                }
            }).then((res) => {
                this.allotRoleVisible = false;
                if(res.data.status == "200") {
                    this.$message.success("角色已分配");
                } else {
                    this.$message.error(rest.data.message);
                }
            })

        },
        //保存用户
        saveUser() {
            let reqData = JSON.stringify({
                uid: this.form.uid,
                username: this.form.username,
                name: this.form.name,
            });

            this.$axios.post(this.NET.USER_ADD_URL, reqData, {
                headers: {
                    "Content-Type": "application/json;charset=utf-8"
                }
            }).then((res) => {
                this.editVisible = false;
                if(res.data.status == "200") {
                    this.$message.success("用户已添加");
                    //更新表格
                    this.getData();
                } else{
                    this.$message.error(res.data.message);
                }
            })

        },
        // 确定删除
        deleteRow() {
            this.tableData.splice(this.idx, 1);
            this.$message.success('删除成功');
            this.delVisible = false;
        }
    }
}
</script>

<style scoped>
.handle-box {
    margin-bottom: 20px;
}

.handle-select {
    width: 120px;
}

.handle-input {
    width: 300px;
    display: inline-block;
}

.del-dialog-cnt {
    font-size: 16px;
    text-align: center
}

.table {
    width: 100%;
    font-size: 14px;
}

.red {
    color: #ff0000;
}

.mr10 {
    margin-right: 10px;
}
</style>
