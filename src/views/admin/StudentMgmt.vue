<template>
  <el-card>
    <div
      style="margin-bottom: 20px; display: flex; justify-content: space-between"
    >
      <el-select
        v-model="filterClassId"
        placeholder="按班级筛选"
        clearable
        @change="fetchStudents"
        style="width: 200px"
      >
        <el-option
          v-for="c in classes"
          :key="c.id"
          :label="formatClassName(c)"
          :value="c.id"
        />
      </el-select>
      <el-button type="primary" @click="openDialog('add')">新增学生</el-button>
    </div>

    <el-table
      :data="studentData"
      v-loading="loading"
      border
      stripe
      size="small"
    >
      <el-table-column prop="name" label="姓名" width="80" fixed />
      <el-table-column prop="gender" label="性别" width="50" />
      <el-table-column prop="student_id" label="学号" width="110" />
      <el-table-column prop="grade_class" label="班级" width="110" />
      <el-table-column prop="status" label="状态" width="70">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)" size="small">{{
            scope.row.status
          }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column
        prop="id_card_number"
        label="身份证号"
        width="170"
        show-overflow-tooltip
      />
      <el-table-column
        prop="city_school_id"
        label="市学籍号"
        width="130"
        show-overflow-tooltip
      />
      <el-table-column
        prop="national_school_id"
        label="国家学籍号"
        width="150"
        show-overflow-tooltip
      />
      <el-table-column prop="household_registration" label="户籍" width="80" />

      <el-table-column label="操作" width="60" fixed="right">
        <template #default="scope">
          <el-button
            type="primary"
            link
            size="small"
            @click="openDialog('edit', scope.row)"
            >编辑</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '录入新学生' : '编辑学生信息'"
      width="650px"
    >
      <el-form :model="form" label-width="100px" :inline="true">
        <el-form-item label="学号">
          <el-input
            v-model="form.student_id"
            :disabled="dialogType === 'edit'"
            style="width: 170px"
          />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.name" style="width: 170px" />
        </el-form-item>

        <el-form-item label="班级">
          <el-select v-model="form.class_id" style="width: 170px">
            <el-option
              v-for="c in classes"
              :key="c.id"
              :label="formatClassName(c)"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input
            v-model="form.id_card_number"
            placeholder="请输入18位身份证"
            maxlength="18"
            style="width: 170px"
          />
        </el-form-item>

        <el-divider content-position="left">学籍详细信息</el-divider>

        <el-form-item label="市学籍号">
          <el-input
            v-model="form.city_school_id"
            placeholder="纯数字"
            style="width: 170px"
          />
        </el-form-item>
        <el-form-item label="国家学籍号">
          <el-input
            v-model="form.national_school_id"
            placeholder="如 G440..."
            style="width: 170px"
          />
        </el-form-item>

        <el-form-item label="户口属地">
          <el-select v-model="form.household_registration" style="width: 170px">
            <el-option label="本市" value="本市" />
            <el-option label="外市" value="外市" />
            <el-option label="港澳台" value="港澳台" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 170px">
            <el-option label="在读" value="在读" />
            <el-option label="休学" value="休学" />
            <el-option label="转出" value="转出" />
            <el-option label="毕业" value="毕业" />
            <el-option label="复学" value="复学" />
          </el-select>
        </el-form-item>

        <el-form-item label="性别" style="width: 100%">
          <el-radio-group v-model="form.gender">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="备注" style="width: 100%">
          <el-input
            v-model="form.remarks"
            type="textarea"
            :rows="2"
            style="width: 460px"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting"
          >保存</el-button
        >
      </template>
    </el-dialog>

    <el-pagination
      layout="prev, pager, next"
      :total="total"
      @current-change="handlePageChange"
      v-model:current-page="currentPage"
      style="margin-top: 20px; text-align: right"
    />
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import {
  getStudents,
  addStudent,
  updateStudent,
  getClasses,
} from "../../api/admin";
import { ElMessage } from "element-plus";

// ... (保留 formatClassName, getStatusType 等辅助函数)
const formatClassName = (c) =>
  `${String(c.entry_year).slice(-2)}级(${String(c.class_num).padStart(
    2,
    "0"
  )})班`;
const getStatusType = (s) =>
  ({ 在读: "success", 休学: "warning", 转出: "info" }[s] || "");

const studentData = ref([]);
const classes = ref([]);
const filterClassId = ref(null);
const total = ref(0);
const currentPage = ref(1);
const loading = ref(false);
const dialogVisible = ref(false);
const dialogType = ref("add");
const submitting = ref(false);

const form = reactive({
  id: null,
  student_id: "",
  name: "",
  gender: "男",
  class_id: null,
  status: "在读",
  household_registration: "本市",
  city_school_id: "",
  national_school_id: "",
  id_card_number: "", // 绑定新字段
  remarks: "",
});

const openDialog = (type, row = null) => {
  dialogType.value = type;
  dialogVisible.value = true;
  if (type === "add") {
    Object.assign(form, {
      id: null,
      student_id: "",
      name: "",
      gender: "男",
      class_id: filterClassId.value || null,
      status: "在读",
      household_registration: "本市",
      city_school_id: "",
      national_school_id: "",
      id_card_number: "",
      remarks: "",
    });
  } else {
    Object.assign(form, row);
  }
};

const validateForm = () => {
  // 1. 必填校验
  if (!form.student_id || !form.name || !form.class_id) {
    ElMessage.warning("请填写必填项(学号、姓名、班级)");
    return false;
  }
  // 2. 市学籍号纯数字校验
  if (form.city_school_id && !/^\d+$/.test(form.city_school_id)) {
    ElMessage.warning("市学籍号必须为纯数字");
    return false;
  }
  // 3. 身份证号简单长度校验 (更复杂的校验可交由后端或用专门正则)
  if (form.id_card_number && form.id_card_number.length !== 18) {
    ElMessage.warning("身份证号应为18位");
    return false;
  }
  return true;
};

const submitForm = async () => {
  if (!validateForm()) return;

  submitting.value = true;
  try {
    if (dialogType.value === "add") {
      await addStudent(form);
      ElMessage.success("添加成功");
    } else {
      await updateStudent(form.id, form);
      ElMessage.success("更新成功");
    }
    dialogVisible.value = false;
    fetchStudents();
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || "操作失败");
  } finally {
    submitting.value = false;
  }
};

const fetchStudents = async () => {
  loading.value = true;
  try {
    const res = await getStudents({
      page: currentPage.value,
      class_id: filterClassId.value,
    });
    studentData.value = res.data.data;
    total.value = res.data.total;
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
  fetchStudents();
};

const fetchClasses = async () => {
  const res = await getClasses();
  classes.value = res.data;
};

onMounted(() => {
  fetchClasses();
  fetchStudents();
});
</script>
