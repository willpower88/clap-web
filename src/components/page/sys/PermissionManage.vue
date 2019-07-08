<template>
    <div class="table">
        <div class="crumbs">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item><i class="el-icon-lx-cascades"></i>菜单管理</el-breadcrumb-item>
            </el-breadcrumb>
        </div>
        <div class="container">
            <div class="handle-box">
                <el-button type="primary" icon="el-icon-delete" class="handle-del mr10" @click="delAll">批量删除</el-button>
                <el-button type="primary" icon="el-icon-edit" class="handle-del mr10" @click="showPermission">新增权限</el-button>
                <el-input v-model="select_word" placeholder="筛选关键词" class="handle-input mr10"></el-input>
                <el-button type="primary" icon="search" @click="search">搜索</el-button>
            </div>
            <el-table :data="data" border class="table" ref="multipleTable" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="55" align="center"></el-table-column>
                <el-table-column prop="id" label="权限ID" width="80">
                </el-table-column>
                <el-table-column prop="name" label="权限名称" width="150">
                </el-table-column>
                <el-table-column prop="resourceType" label="权限类型" width="150" :formatter="formatter">
                </el-table-column>
                <el-table-column prop="parentId" label="父节点" width="80">
                </el-table-column>
                <el-table-column prop="permission" label="权限点">
                </el-table-column>
                <el-table-column prop="url" label="权限地址">
                </el-table-column>
                <el-table-column label="操作" width="180" align="center">
                    <template slot-scope="scope">
                        <el-button type="text" icon="el-icon-edit" @click="handleEdit(scope.$index, scope.row)">编辑</el-button>
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
            <el-form ref="form" :model="form" label-width="50px">
                <el-input type="hidden" v-model="form.id"></el-input>
                <el-form-item label="权限名称" label-width="80px">
                    <el-input v-model="form.name"></el-input>
                </el-form-item>
                <el-form-item label="权限类型" label-width="80px">
                    <el-select v-model="form.resourceType" placeholder="请选择" @change="showNode">
                        <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"></el-option>
                    </el-select>
                </el-form-item>
                <div v-show="nodeShow">
                    <el-form-item label="父节点" label-width="80px">
                        <el-select v-model="form.parentId" placeholder="请选择">
                            <el-option v-for="(item, idx) in this.tableData" v-if="item.resourceType===1" :label="item.name" :value="item.id"></el-option>
                        </el-select>
                    </el-form-item>
                </div>
                <el-form-item label="权限标识" label-width="80px">
                    <el-input v-model="form.permission"></el-input>
                </el-form-item>
                <el-form-item label="访问路径" label-width="80px">
                    <el-input v-model="form.url"></el-input>
                </el-form-item>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="editVisible = false">取 消</el-button>
                <el-button type="primary" @click="savePermision">提 交</el-button>
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
                dialogTitle: '',
                nodeShow: false,
                form: {
                    name: '',
                    date: '',
                    resourceType: '',
                    address: ''
                },
                idx: -1,
                options: [{
                    value: '0',
                    label: '根节点'
                },{
                    value: '1',
                    label: '菜单'
                },{
                    value: '2',
                    label: '功能'
                }],
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
                        if (d.name === this.del_list[i].name) {
                            is_del = true;
                            break;
                        }
                    }
                    if (!is_del) {
                        if (d.permission.indexOf(this.select_cate) > -1 &&
                            (d.name.indexOf(this.select_word) > -1 ||
                                d.url.indexOf(this.select_word) > -1)
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
                this.$axios.get(this.NET.PERM_ALL_URL, {
                    params: {
                        pageNum: this.cur_page,
                        pageSize: 5
                    }
                }).then((res) => {
                    this.tableData = res.data.data,
                    this.pageSize = res.data.pageSize,
                    this.totalCount = res.data.pageTotal
                })
            },
            search() {
                this.is_search = true;
            },
            formatter(row, column) {
                if(row.resourceType == "1") {
                    return "菜单";
                } else {
                    return "功能";
                }
            },
            filterTag(value, row) {
                return row.tag === value;
            },
            handleEdit(index, row) {
                this.idx = index;
                this.dialogTitle = "编辑权限";
                const item = this.tableData[index];
                this.form = {
                    id: row.id,
                    name: item.name,
                    permission: item.permission,
                    url: item.url,
                }
                //选中权限类型
                this.options.forEach(ele => {
                    if(item.resourceType == ele.value) {
                        this.form.resourceType = ele.label;
                    }
                });
                //处理父节点
                this.tableData.forEach(ele => {
                    if(ele.id === row.parentId) {
                        this.form.parentId = ele.name;
                        this.nodeShow = true;
                    } else if(row.parentId == 0){
                        this.form.resourceType = "根节点";
                        this.nodeShow = false;
                    }
                })
                this.editVisible = true;
            },
            handleDelete(index, row) {
                this.idx = index;
                this.delVisible = true;
            },
            delAll() {
                const length = this.multipleSelection.length;
                let str = "";
                this.del_list = this.del_list.concat(this.multipleSelection);
                for (let i = 0; i < length; i++) {
                    str += this.multipleSelection[i].name + ' ';
                }
                this.$message.error('删除了' + str);
                this.multipleSelection = [];
            },
            //新增权限（菜单权限或功能点权限)
            showPermission() {
                this.dialogTitle = "添加权限";
                this.editVisible = true;
            },
            showNode() {
                console.log(this.form.resourceType);
                if(this.form.resourceType == '0') {
                    this.nodeShow = false;
                } else {
                    this.nodeShow = true;
                }
            },
            savePermision() {
                //parentId转为数字
                this.tableData.forEach(item => {
                    if(item.name == this.form.parentId) {
                        this.form.parentId = item.id;
                    }
                })
                //resourceType转为数字
                this.options.forEach(item => {
                    if(item.label == this.form.resourceType) {
                        this.form.resourceType = item.value;
                    }
                })
                let reqData = JSON.stringify({
                    id: this.form.id,
                    name: this.form.name,
                    parentId: this.form.parentId,
                    permission: this.form.permission,
                    resourceType: this.form.resourceType,
                    url: this.form.url
                });
                this.$axios.post(this.NET.PERM_SAVE_URL, reqData, {
                    headers: {
                        "Content-Type": "application/json;charset=utf-8"
                    }
                }).then((res) => {
                    if(res.data.status == "200") {
                        this.editVisible = false;
                        this.$message.success("权限已添加");
                    } else {
                        this.$message.error(res.data.message);
                    }
                })
            },
            handleSelectionChange(val) {
                this.multipleSelection = val;
            },
            // 保存编辑
            saveEdit() {
                this.$set(this.tableData, this.idx, this.form);
                this.editVisible = false;
                this.$message.success(`修改第 ${this.idx+1} 行成功`);
            },
            // 确定删除
            deleteRow(){
                let url = this.NET.PERM_DELETE_URL + "/" + this.tableData[this.idx].id;
                this.$axios.get(url).then((res) => {
                    if(res.data.status == "200") {
                        this.tableData.splice(this.idx, 1);
                        this.$message.success('删除成功');
                        this.delVisible = false;
                    } else {
                        this.$message.error(res.data.message);
                    }
                })
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
