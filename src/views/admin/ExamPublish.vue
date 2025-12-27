<template>
  <el-card>
    <template #header>
      <div class="header">
        <h3>考试发布与管理</h3>
        <el-button type="primary" @click="openDialog">发布新考试</el-button>
      </div>
    </template>

    <div style="margin-bottom: 20px; display: flex; gap: 10px">
      <el-select
        v-model="filterYear"
        placeholder="筛选年级"
        clearable
        @change="fetchTasks"
      >
        <el-option
          v-for="y in gradeOptions"
          :key="y.year"
          :label="y.label"
          :value="y.year"
        />
      </el-select>
      <el-select
        v-model="filterSubject"
        placeholder="筛选科目"
        clearable
        @change="fetchTasks"
      >
        <el-option
          v-for="s in subjects"
          :key="s.id"
          :label="s.name"
          :value="s.id"
        />
      </el-select>
    </div>

    <el-table :data="tasks" border stripe v-loading="loading">
      <el-table-column prop="name" label="考试名称" min-width="150" />
      <el-table-column prop="grade_name" label="年级" width="120" />
      <el-table-column prop="subject_name" label="科目" width="100" />
      <el-table-column prop="full_score" label="满分" width="80" />
      <el-table-column label="录入状态" width="100">
        <template #default="scope">
          <el-switch
            v-model="scope.row.is_active"
            active-text="开"
            inactive-text="关"
            inline-prompt
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="scope">
          <el-button type="primary" link @click="editFullScore(scope.row)"
            >改满分</el-button
          >
          <el-popconfirm
            title="确定删除吗？"
            @confirm="handleDelete(scope.row.id)"
          >
            <template #reference>
              <el-button type="danger" link>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="发布考试任务" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="选择年级">
          <el-select v-model="form.entry_year" style="width: 100%">
            <el-option
              v-for="y in gradeOptions"
              :key="y.year"
              :label="y.label"
              :value="y.year"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="考试类型">
          <el-select
            v-model="form.name"
            allow-create
            filterable
            default-first-option
            placeholder="选择或输入自定义名称"
            style="width: 100%"
          >
            <el-option
              v-for="t in predefinedTypes"
              :key="t"
              :label="t"
              :value="t"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="选择科目">
          <el-select
            v-model="form.subject_id"
            placeholder="选择科目"
            style="width: 100%"
          >
            <el-option
              v-for="s in subjects"
              :key="s.id"
              :label="s.name"
              :value="s.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="满分值">
          <el-input-number v-model="form.full_score" :min="1" :max="999" />
        </el-form-item>

        <el-form-item label="初始状态">
          <el-radio-group v-model="form.is_active">
            <el-radio :label="true">允许录入</el-radio>
            <el-radio :label="false">暂时关闭</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定发布</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import {
  getExamTasks,
  addExamTask,
  updateExamTask,
  deleteExamTask,
  getSubjects,
} from "../../api/admin";
import { ElMessage, ElMessageBox } from "element-plus";

const tasks = ref([]);
const subjects = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);

const filterYear = ref(null);
const filterSubject = ref(null);

const currentYear = new Date().getFullYear();
// 生成最近3年的年级选项 (需要结合月份判断，这里简单处理)
const gradeOptions = computed(() => {
  // 假设9月开学，如果现在是1-8月，初一是去年入学的；如果9-12月，初一是今年入学的
  const isFall = new Date().getMonth() >= 8;
  const base = isFall ? currentYear : currentYear - 1;
  return [
    { year: base, label: `初一 (${base}级)` },
    { year: base - 1, label: `初二 (${base - 1}级)` },
    { year: base - 2, label: `初三 (${base - 2}级)` },
  ];
});

const predefinedTypes = [
  "入学考",
  "初一上期末",
  "初一上期中",
  "初二上期中",
  "初二上期末",
  "初三上期中",
  "初三上期末",
  "初一下期中",
  "初一下期末",
  "初二下期中",
  "初二下期末",
  "初三下期中",
  "初三下期末",
  "初三校一模",
  "初三区一模",
  "初三区二模",
];

const form = reactive({
  entry_year: null,
  name: "",
  subject_id: null,
  full_score: 100,
  is_active: true,
});

const fetchTasks = async () => {
  loading.value = true;
  try {
    const res = await getExamTasks({
      entry_year: filterYear.value,
      subject_id: filterSubject.value,
    });
    tasks.value = res.data;
  } finally {
    loading.value = false;
  }
};

const fetchSubjects = async () => {
  const res = await getSubjects();
  subjects.value = res.data;
};

const openDialog = () => {
  form.entry_year = null;
  form.name = "";
  form.subject_id = null;
  form.full_score = 100;
  form.is_active = true;
  dialogVisible.value = true;
};

const submitForm = async () => {
  if (!form.entry_year || !form.name || !form.subject_id) {
    return ElMessage.warning("请填写完整信息");
  }
  try {
    await addExamTask(form);
    ElMessage.success("发布成功");
    dialogVisible.value = false;
    fetchTasks();
  } catch (err) {
    ElMessage.error(err.response?.data?.msg || "发布失败");
  }
};

const handleStatusChange = async (row) => {
  try {
    await updateExamTask(row.id, { is_active: row.is_active });
    ElMessage.success("状态已更新");
  } catch (err) {
    row.is_active = !row.is_active; // 失败回滚
    ElMessage.error("更新失败");
  }
};

const editFullScore = (row) => {
  ElMessageBox.prompt("请输入新的满分值", "修改满分", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^\d+$/,
    inputErrorMessage: "请输入数字",
    inputValue: row.full_score,
  }).then(async ({ value }) => {
    await updateExamTask(row.id, { full_score: value });
    ElMessage.success("修改成功");
    fetchTasks();
  });
};

const handleDelete = async (id) => {
  await deleteExamTask(id);
  fetchTasks();
};

onMounted(() => {
  fetchSubjects();
  fetchTasks();
});
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
