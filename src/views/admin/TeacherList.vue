<template>
  <el-card>
    <template #header>
      <div
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
        "
      >
        <h3>教师详细信息管理</h3>

        <div style="display: flex; gap: 10px">
          <el-button type="warning" @click="handleExport">
            <el-icon style="margin-right: 5px"><Download /></el-icon>
            下载模板/备份
          </el-button>
          <el-upload
            class="upload-demo"
            action=""
            :show-file-list="false"
            :http-request="handleUpload"
            accept=".xlsx, .xls"
          >
            <el-button type="success"
              ><el-icon style="margin-right: 5px"><Upload /></el-icon>
              Excel批量导入教师</el-button
            >
          </el-upload>
        </div>
      </div>
    </template>

    <el-table :data="teachers" border stripe size="small">
      <el-table-column prop="name" label="姓名" width="70" fixed />
      <el-table-column prop="gender" label="性别" width="50" />
      <el-table-column
        prop="job_duty_display"
        label="职务"
        width="100"
        show-overflow-tooltip
      />
      <el-table-column prop="job_title" label="职称" width="90" />

      <el-table-column label="班主任" min-width="90">
        <template #default="scope">
          <span v-if="scope.row.head_teacher_desc === '否'" style="color: #ccc"
            >否</span
          >
          <span v-else>{{ scope.row.head_teacher_desc }}</span>
        </template>
      </el-table-column>
      <el-table-column label="级长" min-width="80">
        <template #default="scope">
          <span v-if="scope.row.grade_leader_desc === '否'" style="color: #ccc"
            >否</span
          >
          <span v-else>{{ scope.row.grade_leader_desc }}</span>
        </template>
      </el-table-column>
      <el-table-column label="科组长" min-width="80">
        <template #default="scope">
          <span v-if="scope.row.subject_group_desc === '否'" style="color: #ccc"
            >否</span
          >
          <span v-else>{{ scope.row.subject_group_desc }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备课组长" min-width="100" show-overflow-tooltip>
        <template #default="scope">
          <span v-if="scope.row.prep_group_desc === '否'" style="color: #ccc"
            >否</span
          >
          <span v-else>{{ scope.row.prep_group_desc }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="teaching_grades" label="任教级" width="80" />
      <el-table-column
        prop="teaching_classes"
        label="任教班"
        min-width="120"
        show-overflow-tooltip
      />
      <el-table-column
        prop="teaching_subjects"
        label="任教各科"
        min-width="80"
      />

      <el-table-column label="操作" width="140" fixed="right">
        <template #default="scope">
          <el-button
            type="primary"
            link
            size="small"
            @click="editTeacher(scope.row)"
            >编辑</el-button
          >
          <el-popconfirm
            title="确定将密码重置为 123456 吗?"
            @confirm="handleResetPwd(scope.row.id)"
          >
            <template #reference>
              <el-button type="danger" link size="small">重置密码</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="editVisible"
      title="编辑教师多重身份"
      width="700px"
      top="5vh"
    >
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基础信息" name="basic">
          <el-form :model="form" label-width="80px" :inline="true">
            <el-form-item label="姓名"
              ><el-input v-model="form.name" style="width: 150px"
            /></el-form-item>
            <el-form-item label="电话"
              ><el-input v-model="form.phone" style="width: 150px"
            /></el-form-item>
            <el-form-item label="性别">
              <el-select v-model="form.gender" style="width: 150px">
                <el-option label="男" value="男" /><el-option
                  label="女"
                  value="女"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="民族"
              ><el-input v-model="form.ethnicity" style="width: 150px"
            /></el-form-item>
            <el-form-item label="职称">
              <el-select v-model="form.job_title" style="width: 150px">
                <el-option label="中学一级教师" value="中学一级教师" />
                <el-option label="中学高级教师" value="中学高级教师" />
                <el-option label="中学二级教师" value="中学二级教师" />
              </el-select>
            </el-form-item>
            <el-form-item label="学历"
              ><el-input v-model="form.education" style="width: 150px"
            /></el-form-item>
            <el-form-item label="备注"
              ><el-input v-model="form.remarks" style="width: 400px"
            /></el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="职务管理" name="duty">
          <el-form :model="form" label-width="100px">
            <el-form-item label="班主任分配">
              <el-select
                v-model="form.head_teacher_ids"
                multiple
                placeholder="选择班级(可多选)"
                style="width: 100%"
              >
                <el-option
                  v-for="c in classOptions"
                  :key="c.id"
                  :label="`${c.grade_name}(${c.class_num})班`"
                  :value="c.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="级长分配">
              <el-select
                v-model="form.grade_leader_years"
                multiple
                placeholder="选择年级(可多选)"
                style="width: 100%"
              >
                <el-option
                  v-for="y in gradeYearOptions"
                  :key="y.year"
                  :label="y.label"
                  :value="y.year"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="科组长分配">
              <el-select
                v-model="form.subject_group_ids"
                multiple
                placeholder="选择学科(可多选)"
                style="width: 100%"
              >
                <el-option
                  v-for="s in subjectOptions"
                  :key="s.id"
                  :label="s.name"
                  :value="s.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="备课组长">
              <div
                v-for="(item, index) in form.prep_group_data"
                :key="index"
                style="margin-bottom: 5px; display: flex; gap: 5px"
              >
                <el-select
                  v-model="item.entry_year"
                  placeholder="年级"
                  style="width: 120px"
                >
                  <el-option
                    v-for="y in gradeYearOptions"
                    :key="y.year"
                    :label="y.label"
                    :value="y.year"
                  />
                </el-select>
                <el-select
                  v-model="item.subject_id"
                  placeholder="学科"
                  style="width: 120px"
                >
                  <el-option
                    v-for="s in subjectOptions"
                    :key="s.id"
                    :label="s.name"
                    :value="s.id"
                  />
                </el-select>
                <el-button
                  type="danger"
                  icon="Delete"
                  circle
                  size="small"
                  @click="removePrep(index)"
                ></el-button>
              </div>
              <el-button type="primary" link size="small" @click="addPrep"
                >+ 添加备课组</el-button
              >
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTeacher">保存修改</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted, reactive } from "vue";
import {
  getTeachers,
  updateTeacher,
  getClasses,
  getSubjects,
  importTeachersExcel,
  resetTeacherPassword,
  exportTeachers,
} from "../../api/admin";
import { ElMessage } from "element-plus";
import { Delete, Download, Upload } from "@element-plus/icons-vue";

const teachers = ref([]);
const classOptions = ref([]);
const subjectOptions = ref([]);
const editVisible = ref(false);
const activeTab = ref("basic");

// 计算最近几年的“年级”选项，例如 初一(2023级)
const currentYear = new Date().getFullYear();
const gradeYearOptions = [
  { year: currentYear, label: "初一 (2025级)" }, // 示例逻辑，需根据实际调整
  { year: currentYear - 1, label: "初二 (2024级)" },
  { year: currentYear - 2, label: "初三 (2023级)" },
];

const form = reactive({
  id: null,
  name: "",
  gender: "",
  ethnicity: "",
  phone: "",
  job_title: "",
  education: "",
  remarks: "",
  head_teacher_ids: [],
  grade_leader_years: [],
  subject_group_ids: [],
  prep_group_data: [],
});

const fetchData = async () => {
  const res = await getTeachers();
  teachers.value = res.data;
};

const fetchOptions = async () => {
  const cRes = await getClasses();
  classOptions.value = cRes.data;
  const sRes = await getSubjects();
  subjectOptions.value = sRes.data;
};

const editTeacher = (row) => {
  Object.assign(form, row);
  // 确保深拷贝数组，防止编辑时直接影响表格显示
  form.head_teacher_ids = [...row.head_teacher_ids];
  form.grade_leader_years = [...row.grade_leader_years];
  form.subject_group_ids = [...row.subject_group_ids];
  form.prep_group_data = row.prep_group_data.map((i) => ({ ...i }));

  activeTab.value = "basic";
  editVisible.value = true;
};

const addPrep = () => {
  form.prep_group_data.push({ entry_year: null, subject_id: null });
};
const removePrep = (index) => {
  form.prep_group_data.splice(index, 1);
};

const saveTeacher = async () => {
  try {
    await updateTeacher(form.id, form);
    ElMessage.success("更新成功");
    editVisible.value = false;
    fetchData();
  } catch (err) {
    ElMessage.error("保存失败");
  }
};

// 导入老师信息
const handleUpload = async (param) => {
  const formData = new FormData();
  formData.append("file", param.file);

  const loadingInstance = ElMessage.success({
    message: "正在导入教师信息，请稍候...",
    duration: 0,
  });

  try {
    const res = await importTeachersExcel(formData);
    loadingInstance.close();
    ElMessage.success(res.data.msg);
    // 导入完成后刷新列表
    fetchData();
  } catch (err) {
    loadingInstance.close();
    ElMessage.error(err.response?.data?.msg || "导入失败");
  }
};

// 重置教师密码
const handleResetPwd = async (id) => {
  try {
    const res = await resetTeacherPassword(id);
    ElMessage.success(res.data.msg);
  } catch (err) {
    ElMessage.error(err.response?.data?.msg || "重置失败");
  }
};

const handleExport = async () => {
  try {
    const res = await exportTeachers();

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "教师信息表(含职务分配).xlsx");

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    ElMessage.error(err.response?.data?.msg || "导出失败");
  }
};

onMounted(() => {
  fetchData();
  fetchOptions();
});
</script>
