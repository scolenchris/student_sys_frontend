<template>
  <el-card>
    <template #header>
      <div class="header-tools">
        <h3>全班成绩统计排名</h3>
        <div class="filter-bar">
          <el-select v-model="selectedClass" placeholder="选择班级" @change="fetchReport">
            <el-option v-for="c in classes" :key="c.id" 
                       :label="`${c.grade_name}(${c.class_num})班`" :value="c.id" />
          </el-select>
          <el-input v-model="term" placeholder="学期" style="width: 150px" @change="fetchReport" />
          <el-button type="success" @click="exportCSV">导出报表</el-button>
        </div>
      </div>
    </template>

    <el-table 
      :data="reportData" 
      stripe border 
      show-summary 
      :summary-method="getSummaries"
      v-loading="loading"
      style="width: 100%"
    >
      <el-table-column prop="rank" label="名次" width="70" fixed />
      <el-table-column prop="student_id" label="学号" width="120" fixed />
      <el-table-column prop="name" label="姓名" width="100" fixed />
      
      <el-table-column v-for="sub in dynamicSubjects" :key="sub" :label="sub">
        <template #default="scope">
          {{ scope.row.scores[sub] !== undefined ? scope.row.scores[sub] : '-' }}
        </template>
      </el-table-column>

      <el-table-column prop="total" label="总分" width="90" fixed="right" />
    </el-table>
  </el-card>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';

const classes = ref([]);
const selectedClass = ref(null);
const term = ref('2024-2025-1');
const reportData = ref([]);
const dynamicSubjects = ref([]);
const loading = ref(false);
const subjectAverages = ref({}); // 存储后端返回的各科均分


const fetchClasses = async () => {
  const res = await axios.get('http://localhost:5000/api/admin/classes');
  classes.value = res.data;
};

// const fetchReport = async () => {
//   // 增加验证：必须有班级和学期才发请求
//   if (!selectedClass.value || !term.value) return;
  
//   loading.value = true;
//   try {
//     const res = await axios.get('http://localhost:5000/api/admin/stats/class_report', {
//       params: { 
//         class_id: selectedClass.value, 
//         term: term.value 
//       }
//     });
//     // console.log("报表数据:", res.data);
    
//     dynamicSubjects.value = res.data.subjects;
//     reportData.value = res.data.report;
//   } catch (err) {
//     ElMessage.error("获取统计数据失败");
//   } finally {
//     loading.value = false;
//   }
// };
const fetchReport = async () => {
  // ... axios 请求逻辑 ...
  const res = await axios.get('http://localhost:5000/api/admin/stats/class_report', {
      params: { 
        class_id: selectedClass.value, 
        term: term.value 
      }
  });
  reportData.value = res.data.report;
  dynamicSubjects.value = res.data.subjects;
  subjectAverages.value = res.data.subject_averages; // 接收均分数据
};

// 自定义表尾合计行逻辑
const getSummaries = (param) => {
  const { columns } = param;
  const sums = [];
  
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '均分';
      return;
    }
    if (index === 1 || index === 2) {
      sums[index] = '-';
      return;
    }
    
    // 如果是科目列，显示我们从后端拿到的平均分
    const subName = column.label;
    if (subjectAverages.value[subName]) {
      sums[index] = subjectAverages.value[subName];
    } else if (column.property === 'total') {
        // 计算全班总分的平均分
        const totalSum = reportData.value.reduce((prev, curr) => prev + curr.total, 0);
        sums[index] = reportData.value.length > 0 ? (totalSum / reportData.value.length).toFixed(1) : 0;
    } else {
      sums[index] = '';
    }
  });
  
  return sums;
};

// 增加监听：当学期变化时也自动刷新
watch([selectedClass, term], () => {
  if (selectedClass.value) fetchReport();
});

// 导出 CSV (轻量级，老电脑不需要安装额外库)
const exportCSV = () => {
  let csvContent = "data:text/csv;charset=utf-8,名次,学号,姓名," + dynamicSubjects.value.join(",") + ",总分,平均分\n";
  reportData.value.forEach(row => {
    let subScores = dynamicSubjects.value.map(sub => row.scores[sub] || 0).join(",");
    csvContent += `${row.rank},${row.student_id},${row.name},${subScores},${row.total},${row.average}\n`;
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `成绩单_${term.value}.csv`);
  document.body.appendChild(link);
  link.click();
};

onMounted(fetchClasses);
</script>