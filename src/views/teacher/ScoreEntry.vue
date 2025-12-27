<template>
  <el-card>
    <template #header>
      <div class="header-row">
        <span style="font-weight: bold">成绩录入工作台</span>
        <div class="controls">
          <el-select
            v-model="selectedKey"
            placeholder="① 选择任教班级与科目"
            @change="handleCourseChange"
            style="width: 240px"
          >
            <el-option
              v-for="item in myCourses"
              :key="item.assignment_id"
              :label="`${item.grade_class} - ${item.subject_name}`"
              :value="item.assignment_id"
            />
          </el-select>

          <el-select
            v-model="selectedExamId"
            placeholder="② 选择管理员发布的考试"
            :disabled="!selectedKey"
            @change="handleExamChange"
            style="width: 220px"
          >
            <el-option
              v-for="ex in examList"
              :key="ex.id"
              :label="`${ex.name} ${!ex.is_active ? '(已锁)' : ''}`"
              :value="ex.id"
              :disabled="!ex.is_active"
            />
          </el-select>
        </div>
      </div>
    </template>

    <div v-if="!selectedExamId" class="empty-tip">
      请先按顺序选择 <b>班级科目</b> 和 <b>考试任务</b>
    </div>

    <div v-else>
      <div class="exam-info">
        当前录入：<el-tag>{{ currentExamInfo?.name }}</el-tag> 满分标准：<el-tag
          type="warning"
          >{{ currentExamInfo?.full_score }}分</el-tag
        >
      </div>

      <el-table :data="students" border stripe v-loading="loading">
        <el-table-column prop="student_no" label="学号" width="140" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column :label="`成绩 (0-${currentExamInfo?.full_score})`">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.score"
              :min="0"
              :max="currentExamInfo?.full_score"
              :precision="1"
              :controls="false"
              style="width: 100%"
            />
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; text-align: right">
        <el-button
          type="primary"
          size="large"
          @click="saveAllScores"
          :loading="saving"
        >
          保存所有成绩
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  getMyCourses,
  getScoreList,
  saveScores,
  getAvailableExams,
} from "../../api/teacher";

const router = useRouter();
const myCourses = ref([]);
const selectedKey = ref(null); // 选中的 assignment_id
const selectedCourseInfo = ref(null); // 选中的课程详情对象
const examList = ref([]); // 可选的考试列表
const selectedExamId = ref(null); // 选中的 exam_task_id
const students = ref([]);
const loading = ref(false);
const saving = ref(false);

const currentExamInfo = computed(() => {
  return examList.value.find((e) => e.id === selectedExamId.value);
});

// 获取老师课程
const fetchMyCourses = async () => {
  const userId = localStorage.getItem("user_id");
  if (!userId) return router.push("/");
  try {
    const res = await getMyCourses(userId);
    myCourses.value = res.data;
  } catch (err) {
    console.error(err);
  }
};

// 1. 课程切换 -> 获取可用考试列表
const handleCourseChange = async (assignmentId) => {
  selectedExamId.value = null;
  students.value = [];
  const info = myCourses.value.find(
    (item) => item.assignment_id === assignmentId
  );
  selectedCourseInfo.value = info;

  // 获取该班级该科目下的考试
  try {
    const res = await getAvailableExams({
      class_id: info.class_id,
      subject_id: info.subject_id,
    });
    examList.value = res.data;
    if (examList.value.length === 0) {
      ElMessage.info("管理员暂未发布该年级科目的任何考试");
    }
  } catch (err) {
    ElMessage.error("获取考试列表失败");
  }
};

// 2. 考试切换 -> 获取学生成绩单
const handleExamChange = async (examId) => {
  if (!selectedCourseInfo.value) return;

  loading.value = true;
  try {
    const res = await getScoreList({
      class_id: selectedCourseInfo.value.class_id,
      exam_task_id: examId,
    });
    students.value = res.data;
  } catch (err) {
    ElMessage.error("获取名单失败");
  } finally {
    loading.value = false;
  }
};

// 3. 保存
const saveAllScores = async () => {
  saving.value = true;
  try {
    await saveScores({
      exam_task_id: selectedExamId.value,
      scores: students.value.map((s) => ({
        student_id: s.student_id,
        score: s.score,
      })),
    });
    ElMessage.success("保存成功");
  } catch (err) {
    ElMessage.error(err.response?.data?.msg || "保存失败");
  } finally {
    saving.value = false;
  }
};

onMounted(fetchMyCourses);
</script>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.controls {
  display: flex;
  gap: 10px;
}
.empty-tip {
  padding: 40px;
  text-align: center;
  color: #909399;
}
.exam-info {
  margin-bottom: 15px;
  display: flex;
  gap: 15px;
  align-items: center;
}
</style>
