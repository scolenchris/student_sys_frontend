<template>
  <el-card class="stats-card">
    <template #header>
      <div class="header-row">
        <h3>综合成绩统计与排名</h3>
        <el-button
          type="success"
          @click="exportCSV"
          :disabled="tableData.length === 0"
        >
          导出报表
        </el-button>
      </div>
    </template>

    <el-form :inline="true" class="filter-bar">
      <el-form-item label="年级">
        <el-select
          v-model="query.entry_year"
          placeholder="选择年级"
          @change="handleYearChange"
          style="width: 140px"
        >
          <el-option
            v-for="y in gradeOptions"
            :key="y.year"
            :label="y.label"
            :value="y.year"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="考试名称">
        <el-select
          v-model="query.exam_name"
          placeholder="先选年级"
          :disabled="!query.entry_year"
          style="width: 180px"
          @change="handleSearch"
        >
          <el-option
            v-for="name in examNameOptions"
            :key="name"
            :label="name"
            :value="name"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="统计科目">
        <el-select
          v-model="query.subject_ids"
          multiple
          collapse-tags
          placeholder="选择科目"
          style="width: 220px"
          @change="handleSearch"
        >
          <el-option
            v-for="s in subjectOptions"
            :key="s.id"
            :label="s.name"
            :value="s.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="显示班级">
        <el-select
          v-model="query.class_ids"
          multiple
          collapse-tags
          placeholder="默认全级 (可多选)"
          style="width: 220px"
          :disabled="!query.entry_year"
          @change="handleSearch"
        >
          <el-option
            v-for="c in filteredClassOptions"
            :key="c.id"
            :label="`${c.grade_name}(${c.class_num})班`"
            :value="c.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSearch" :loading="loading"
          >查询</el-button
        >
      </el-form-item>
    </el-form>

    <el-table
      :data="tableData"
      border
      stripe
      height="600"
      v-loading="loading"
      style="width: 100%"
    >
      <el-table-column label="级排名 (Grade Rank)" align="center" fixed>
        <el-table-column
          prop="grade_rank_skip"
          width="95"
          sortable
          align="center"
        >
          <template #header>
            <span>总分排名</span>
            <el-tooltip
              content="仅按总分排序。同分同名，名次跳过 (例: 1, 1, 3)"
              placement="top"
            >
              <el-icon style="margin-left: 3px; vertical-align: middle"
                ><InfoFilled
              /></el-icon>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column
          prop="grade_rank_dense"
          width="95"
          sortable
          align="center"
        >
          <template #header>
            <span>规则排名</span>
            <el-tooltip
              content="严格排序 (1, 2, 3...)。总分相同时，依次比较：语、数、英、听说、理、化、道法、史、生、地、体、信、美、音"
              placement="top"
            >
              <el-icon style="margin-left: 3px; vertical-align: middle"
                ><InfoFilled
              /></el-icon>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="班排名 (Class Rank)" align="center">
        <el-table-column
          prop="class_rank_skip"
          label="总分"
          width="70"
          align="center"
        />
        <el-table-column
          prop="class_rank_dense"
          label="规则"
          width="70"
          align="center"
        />
      </el-table-column>
      <el-table-column prop="student_id" label="学号" width="120" fixed />
      <el-table-column prop="name" label="姓名" width="100" fixed />
      <el-table-column
        prop="class_name"
        label="班级"
        width="110"
        show-overflow-tooltip
      />
      <el-table-column prop="status" label="状态" width="70">
        <template #default="scope">
          <el-tag
            size="small"
            :type="scope.row.status === '在读' ? 'success' : 'info'"
          >
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column
        v-for="sub in dynamicColumns"
        :key="sub"
        :label="sub"
        min-width="80"
        align="center"
      >
        <template #default="scope">
          <span v-if="scope.row.scores[sub] !== undefined">{{
            scope.row.scores[sub]
          }}</span>
          <span v-else style="color: #ddd">-</span>
        </template>
      </el-table-column>

      <el-table-column
        prop="total"
        label="总分"
        width="90"
        fixed="right"
        sortable
      />
      <el-table-column
        prop="full_score"
        label="满分值"
        width="80"
        fixed="right"
      />
    </el-table>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import {
  getSubjects,
  getClasses,
  getExamNames,
  getComprehensiveReport,
} from "../../api/admin";
import { ElMessage } from "element-plus";

// --- State ---
const loading = ref(false);
const subjectOptions = ref([]); // 所有可选科目
const allClassOptions = ref([]); // 所有班级列表
const examNameOptions = ref([]); // 当前年级的考试名称列表

const tableData = ref([]);
const dynamicColumns = ref([]); // 后端返回的科目名称列表，用于表头

const query = reactive({
  entry_year: null,
  exam_name: "",
  subject_ids: [],
  class_ids: [],
});

// --- Computed ---

// 生成最近5年的年级选项
const currentYear = new Date().getFullYear();
const gradeOptions = computed(() => {
  // 1. 如果还没有加载到班级数据，返回空
  if (!allClassOptions.value || allClassOptions.value.length === 0) {
    return [];
  }

  // 2. 提取所有班级的 entry_year
  const years = allClassOptions.value.map((c) => c.entry_year);

  // 3. 去重 (利用 Set)
  const uniqueYears = [...new Set(years)];

  // 4. 排序 (降序，让最近的年份如 2025 排在前面)
  uniqueYears.sort((a, b) => b - a);

  // 5. 映射为下拉框需要的格式
  return uniqueYears.map((y) => ({ year: y, label: `${y}级` }));
});

// 根据选中的年级，筛选出属于该年级的班级选项
const filteredClassOptions = computed(() => {
  if (!query.entry_year) return [];
  return allClassOptions.value.filter((c) => c.entry_year === query.entry_year);
});

// --- Methods ---

// 初始化加载基础数据
const initData = async () => {
  try {
    const [sRes, cRes] = await Promise.all([getSubjects(), getClasses()]);
    subjectOptions.value = sRes.data;
    allClassOptions.value = cRes.data;

    // 默认选中所有科目方便用户
    // query.subject_ids = sRes.data.map(s => s.id);
  } catch (err) {
    ElMessage.error("初始化数据失败");
  }
};

// 年级改变时：1. 清空考试名和班级选择 2. 获取该年级的考试列表
const handleYearChange = async (val) => {
  query.exam_name = "";
  query.class_ids = [];
  tableData.value = [];
  examNameOptions.value = [];

  if (!val) return;

  try {
    const res = await getExamNames(val);
    examNameOptions.value = res.data;
  } catch (err) {
    ElMessage.error("获取考试列表失败");
  }
};

// 执行查询
const handleSearch = async () => {
  // 简单校验
  if (!query.entry_year || !query.exam_name || query.subject_ids.length === 0) {
    // 还没选完时不强制报错，只是不查
    return;
  }

  loading.value = true;
  try {
    const res = await getComprehensiveReport({
      entry_year: query.entry_year,
      exam_name: query.exam_name,
      subject_ids: query.subject_ids,
      class_ids: query.class_ids,
    });

    tableData.value = res.data.data;
    dynamicColumns.value = res.data.subjects; // 确保表头顺序和后端一致

    if (tableData.value.length === 0) {
      ElMessage.info("未查询到相关成绩数据");
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.msg || "查询失败");
  } finally {
    loading.value = false;
  }
};

// 导出 CSV
const exportCSV = () => {
  if (tableData.value.length === 0) return;

  // 更新表头
  const headers = [
    "级排名(总分并列)",
    "级排名(规则严格)",
    "班排名(总分并列)",
    "班排名(规则严格)",
    "学号",
    "姓名",
    "班级",
    "状态",
    ...dynamicColumns.value,
    "总分",
    "满分值",
  ];

  let csvContent =
    "data:text/csv;charset=utf-8,\ufeff" + headers.join(",") + "\n";

  tableData.value.forEach((row) => {
    const subScores = dynamicColumns.value.map((sub) =>
      row.scores[sub] !== undefined ? row.scores[sub] : "-"
    );

    const rowData = [
      row.grade_rank_skip,
      row.grade_rank_dense,
      row.class_rank_skip,
      row.class_rank_dense,
      row.student_id,
      row.name,
      row.class_name,
      row.status,
      ...subScores,
      row.total,
      row.full_score,
    ];
    csvContent += rowData.join(",") + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const fileName = `${query.entry_year}级_${query.exam_name}_成绩报表.csv`;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

onMounted(initData);
</script>

<style scoped>
.stats-card {
  min-height: 80vh;
}
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-bar {
  margin-bottom: 10px;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}
</style>
