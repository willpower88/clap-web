<template>
    <div class="table">
        <div class="crumbs">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item><i class="el-icon-lx-cascades"></i>角色管理</el-breadcrumb-item>
            </el-breadcrumb>
        </div>
        <div class="container">
            <div class="handle-box">
                <el-button type="primary" icon="el-icon-delete" class="handle-del mr10" @click="delAll">批量删除</el-button>
                <el-button type="primary" icon="el-icon-edit" class="handle-add mr10" @click="handleRole">新增角色</el-button>
                <el-select v-model="select_cate" placeholder="筛选省份" class="handle-select mr10">
                    <el-option key="1" label="广东省" value="广东省"></el-option>
                    <el-option key="2" label="湖南省" value="湖南省"></el-option>
                </el-select>
                <el-input v-model="select_word" placeholder="筛选关键词" class="handle-input mr10"></el-input>
                <el-button type="primary" icon="el-icon-search" @click="search">搜索</el-button>
            </div>
            <el-table :data="data" border class="table" ref="multipleTable" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="55" align="center"></el-table-column>
                <el-table-column prop="id" label="ID" sortable width="80">
                </el-table-column>
                <el-table-column prop="role" label="角色名称" width="120">
                </el-table-column>
                <el-table-column prop="description" label="角色描述">
                </el-table-column>
                <el-table-column prop="available" label="角色状态" :formatter="formatter">
                </el-table-column>
                <el-table-column label="操作" align="center">
                    <template slot-scope="scope">
                        <el-button type="text" icon="el-icon-edit" @click="handleEdit(scope.$index, scope.row)">编辑</el-button>
                        <el-button type="text" icon="el-icon-check" @click="handleEmpower(scope.$index, scope.row)">授权</el-button>
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
            <el-form ref="form" :model="form" :rules="rules" label-width="100px">
                <el-input type="hidden" v-model="form.id"></el-input>
                <el-form-item label="角色">
                    <el-input v-model="form.role"></el-input>
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="form.description"></el-input>
                </el-form-item>
                <el-form-item label="是否可用">
                    <el-switch v-model="form.available"></el-switch>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="editVisible = false">取 消</el-button>
                <el-button type="primary" @click="dialogSubmit">确 定</el-button>
            </span>
        </el-dialog>
        <!--权限弹出框 -->
        <el-dialog :title="dialogTitle" :visible.sync="empowerVisible" width="30%">
            <el-form ref="form" :model="form" :rules="rules" label-width="80px">
                <el-input type="hidden" v-model="form.roleId"></el-input>
            </el-form>
                <el-tree
                  :data="permData"
                  :default-checked-keys="checkedKeys"
                  show-checkbox
                  default-expand-all
                  node-key="id"
                  ref="tree"
                  highlight-current>
                </el-tree>
            <span slot="footer" class="dialog-footer">
                <el-button @click="empowerVisible = false">取 消</el-button>
                <el-button type="primary" @click="saveEmpower">确 定</el-button>
            </span>
        </el-dialog>

        <!-- 删除提示框 -->
        <el-dialog title="提示" :visible.sync="delVisible" width="300px" center>
            <div class="del-dialog-cnt">删除不可恢复，是否确定删除？</div>
            <span slot="footer" class="dialog-footer">
                <el-button @click="delVisible = false">取 消</el-button/>
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
                permData: [],
                empowerData: [],
                checkedKeys: [],
                cur_page: 1,
                totalCount: 100,
                pageSize: 5,
                multipleSelection: [],
                select_cate: '',
                select_word: '',
                del_list: [],
                is_search: false,
                editVisible: false,
                delVisible: false,
                empowerVisible: false,
                dialogTitle:'',
                form: {
                    role: '',
                    description: '',
                    available: '',
                    menuPerm: [],
                    funcPerm: [],
                },
                rules: {
                    role: [
                        { require: true, message: '请输入角色名', trigger: 'blur'}
                    ],
                    description: [
                        { require: true, message: '请输入角色描述', trigger: 'blur'}

                    ]
                },
                idx: -1
            }
        },
        created() {
            this.getData();
        },
        computed: {
            data() {
                return this.tableData.filter((d) => {
                    let is_del = false;
                    for (let i = 0; i < this.del_list.length; i++) {
                        if (d.role === this.del_list[i].role) {
                            is_del = true;
                            break;
                        }
                    }
                    if (!is_del) {
                        if (d.role.indexOf(this.select_cate) > -1 &&
                            (d.role.indexOf(this.select_word) > -1 ||
                                d.role.indexOf(this.select_word) > -1)
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
                this.$axios.get(this.NET.ROLE_ALL_URL, {
                    params: {
                        pageNum: this.cur_page,
                        pageSize: 5
                    }
                }).then((res) => {
                    this.tableData = res.data.data,
                    this.pageSize = res.data.pageInfo.pageSize,
                    this.totalCount = res.data.pageInfo.total
                });
            },
            search() {
                this.is_search = true;
            },
            formatter(row, column) {

                if(row.available == true) {
                    return "有效";
                } else {
                    return "无效";
                }
            },
            filterTag(value, row) {
                return row.tag === value;
            },
            handleEdit(index, row) {
                this.idx = index;
                const item = this.tableData[index];
                this.form = {
                    id: item.id,
                    role: item.role,
                    description: item.description,
                    available: item.available
                }
                this.dialogTitle = "编辑角色";
                this.editVisible = true;
            },
            //角色授权
            handleEmpower(index, row) {
                this.dialogTitle = "角色授权";
                this.form.roleId = row.id;
                this.menuPerm = [];
                this.funcPerm = [];
                this.empowerData = [];
                this.permData = [];
                this.handlePermission(row);
                this.empowerVisible = true;
            },
            saveEmpower() {
                let cks = this.$refs.tree.getCheckedKeys();
                let hcks = this.$refs.tree.getHalfCheckedKeys();
                let allKeys = cks.concat(hcks);
                let reqData = JSON.stringify({
                    roleId : this.form.roleId,
                    perms : allKeys
                })
                this.$axios.post(this.NET.PERM_ROLE_SAVE_URL, reqData, {
                    headers: {
                        "Content-Type": "application/json;charset=utf-8"
                    }
                }).then((res) => {
                    this.empowerVisible = false;
                    if(res.data.status == "200") {
                        this.$message.success(`角色 ${this.form.roleId}, 授权成功`);
                    } else {
                        this.$message.error(res.data.message);
                    }
                }).catch(error => {
                    console.log(error);
                })


            },
            handleDelete(index, row) {
                this.idx = index;
                this.delVisible = true;
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
            handleRole(){
                this.dialogTitle = "新增角色";
                this.editVisible = true;
                this.form.id = '';
                this.form.role = '';
                this.form.description = '';
                this.form.available = false;
            },
            handleSelectionChange(val) {
                this.multipleSelection = val;
            },
            dialogSubmit() {
                if(this.form.id == '') {
                    this.saveRole();
                } else {
                    this.saveRoleEdit();
                }
            },
            // 保存编辑
            saveRoleEdit() {
                this.$set(this.tableData, this.idx, this.form);
                let reqData = JSON.stringify({
                    id: this.form.id,
                    role: this.form.role,
                    description: this.form.description,
                    available: this.form.available
                });
                this.$axios.post(this.NET.ROLE_UPDATE_URL, reqData, {
                    headers: {
                        "Content-Type": "application/json;charset=utf-8"
                    }
                }).then((res) => {
                    this.editVisible = false;
                    if(res.data.status == "200") {
                        this.$message.success(`修改第 ${this.idx+1} 行成功`);
                    } else {
                        this.$message.error(res.data.message);
                    }
                })
            },
            saveRole() {
                let reqData = JSON.stringify({
                    role: this.form.role,
                    description: this.form.description,
                    available: this.form.available
                });
                this.$axios.post(this.NET.ROLE_ADD_URL, reqData, {
                    headers: {
                        "Content-Type": "application/json;charset=utf-8"
                    }
                }).then((res) => {
                    this.editVisible = false;
                    if(res.data.status == "200") {
                        this.$message.success(`新增 ${this.form.role} 角色成功`);
                    } else {
                        this.$message.error(res.data.message);
                    }
                })
            },
            // 确定删除
            deleteRow(){
                this.tableData.splice(this.idx, 1);
                this.$message.success('删除成功');
                this.delVisible = false;
            },
            handlePermission(row) {
                //获取已赋予的权限
                let reqUrl = this.NET.PERM_URL + "/" + row.id;
                this.$axios.get(reqUrl).then((res) => {
                    this.checkedKeys = [];
                    //生成选择Tree
                    this.permData = this.genPermTree(res.data.data, 0);
                    //去除半选父节点的选中状态
                    this.deleteChecked(res.data.data, this.checkedKeys);
                });
            },
            deleteChecked(srcData, chkData) {
                let arr = [];
                srcData.forEach(item => {
                    if(item.checked == false) {
                        arr.push(item.parentId);
                    }
                })
                chkData.forEach(function(item, index) {
                    arr.forEach(item1 => {
                        if (item == item1) {
                            chkData.splice(index, 1);
                        }
                    })
                })
                return chkData;
            },
            genPermTree(data, pid) {
                let arr = [];
                data.forEach(item => {
                    if(item.parentId == pid) {
                        var newNode = {};
                        newNode.id = item.id;
                        newNode.label = item.name;
                        //设置已有权限
                        if(item.checked == true) {
                            this.checkedKeys.push(item.id);
                        }
                        newNode.children = this.genPermTree(data, item.id);
                        arr.push(newNode);
                    }
                })
                return arr;
            },
            handlePermission_bak(row) {
                //获取已赋予的权限
                let reqUrl = this.NET.PERM_URL + "/" + row.id;
                this.$axios.get(reqUrl).then((res) => {
                    this.empowerData = res.data.data;
                });
                //获取权限数据
                this.$axios.get(this.NET.PERM_ALL_URL).then((res) => {
                    res.data.data.forEach(function(item, idx) {
                        item.chk = false;
                    });
                    this.empowerData.forEach(function(item, idx) {
                        for(var i = 0; i < res.data.data.length; i++) {
                            if(item.id == res.data.data[i].id) {
                                res.data.data[i].chk = true;
                            }
                        }
                    });
                    this.permData = res.data.data;
                });
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
    .del-dialog-cnt{
        font-size: 16px;
        text-align: center
    }
    .add-dialog-cnt{
        font-size: 16px;
        text-align: ceter
    }
    .table{
        width: 100%;
        font-size: 14px;
    }
    .red{
        color: #ff0000;
    }
    .mr10{
        margin-right: 10px;
    }
</style>
