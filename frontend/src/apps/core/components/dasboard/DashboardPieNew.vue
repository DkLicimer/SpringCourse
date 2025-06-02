<template>
  <div>

    <div v-if="isLoading && !alertText">
      <v-row>

        <v-col cols="12" md="12" lg="5">
          <Pie
            :options="chartOptions"
            :data="chartData"
            class="elevation-5 rounded-circle mx-auto"
          />
        </v-col>

        <v-col cols="12" md="12" lg="7">
          <div>
            <v-chip
              @click="open(item.id)"
              size="small"
              v-for="(item, index) in labelsData" :key="index"
              variant="elevated"
              class="px-3 me-3 mb-4  chip-filter"
              :color="item.color"
              elevation="5">
              {{ item.label }}
            </v-chip>
            <div class="mt-2"><b>Всего: {{sum}} {{measurement}}</b>  </div>
          </div>
        </v-col>
      </v-row>


    </div>


    <v-progress-linear
      v-if="!isLoading"
      :indeterminate="true"
      color="primary"
      class="mb-0"
    />


    <v-alert
      v-if="isLoading && alertText"
      icon="$info"
      color="primary"
      variant="tonal"
      :elevation="4"
      class="mb-3 w-100 small py-3"
      :text=alertText
    />


    <v-dialog
      v-model="dialogShow"
      max-width="700"
    >
      <v-card class="br-10 " elevation="5">
        <!-- тело -->
        <v-card-text>
          <v-progress-linear
            v-if="!isLoadingDialog"
            :indeterminate="true"
            color="primary"
            class="mb-0"
          />


          <div
            v-for="(project, i) in dialogData"
            :key="i"
            class=" row-border align-center"
          >
            <router-link class="text-decoration-none text-black  align-center px-0 py-2 h-100 d-md-flex"
                         :to="{name:'ProjectDv', params:{id:project.id}} " target="_blank">
              <div class="px-3 pb-1 pt-2 pt-mb-1 text-center">
                <v-avatar v-if="project.avatar" :image="project.avatar" class="me-3">
                </v-avatar>
                <v-avatar v-else :color="project.avatarColor"  class="me-3">
                  {{ project.avatarText }}
                </v-avatar>
              </div>

              <div class="px-3 py-1 ">
                <p>{{ project.projectName }}</p>
                <p v-if="project.innName !== ' - '"><small>{{ project.innName }}</small></p>
              </div>

              <div class="ms-auto px-3 pt-3 pb-6 pb-md-3">
                <v-chip color="primary" class='w-100 text-center justify-center' variant="tonal" elevation="1">{{ project.val }}</v-chip>
              </div>
            </router-link>
          </div>


        </v-card-text>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>
import {Pie} from "vue-chartjs";


export default {
  components: {Pie},
  props: ['title', 'url', 'measurement'],

  data() {
    return {
      isLoading: true,
      isLoadingDialog: false,
      dialogShow: false,
      labelsData: [],
      dialogData: [],
      alertText: '',
      sum: 0,

      chartData: {
        labels: ['January', 'February', 'March'],
        datasets: [{
          data: [40, 20, 12],
          backgroundColor: ['#a4a', 'blue', 'red']
        }]
      },
      chartOptions: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          }
        }
      }
    }
  },

  methods: {
    async open(id) {
      this.dialogShow = true;
      this.isLoadingDialog = false;
      try {
        let url = `${this.url}?id=${id}`
        if (this.url.indexOf("?") >= 0){
          url = `${this.url}&id=${id}`
        }
        const response = await fetch(url, {method: 'get'});
        if (response.status === 200) {
          this.dialogData = await response.json();
        } else {
          this.alertText = 'Ошибка при обращение к серверу. Подробности в консоли'
        }
      } catch (e) {
        this.alertText = 'Ошибка при обращение к серверу. Подробности в консоли'
      }
      this.isLoadingDialog = true;


    },
    async getDashboard() {
      this.isLoading = false
      this.alertText = ''
      try {
        const response = await fetch(this.url, {method: 'get'});
        if (response.status === 200) {
          const data = await response.json();
          this.chartData.labels = data.labels;
          this.chartData.datasets[0].data = data.data;
          this.chartData.datasets[0].backgroundColor = data.backgroundColor;
          this.labelsData = data.labelsData;
          this.sum = data.sum;
        } else {
          this.alertText = 'Ошибка при обращение к серверу. Подробности в консоли'
        }
      } catch (e) {
        this.alertText = 'Ошибка при обращение к серверу. Подробности в консоли'
      }
      this.isLoading = true
    }
  },

  async created() {
    await this.getDashboard();
  },
}
</script>

<style scoped lang="scss">
.row-border {
  border-bottom: 1px solid #ddd;

  &:hover {
    background-color: #f5f5f5;
  }
}
</style>
