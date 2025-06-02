<template>
  <v-card class="px-7 py-7 br-20 h-100" elevation="5">
    <h1 class="text-center mb-7">{{ title }}</h1>

    <div v-if="isLoading && !alertText">
      <v-row>

        <v-col cols="12">
          <Bar
            :options="chartOptions"
            :data="chartData"
            class=""
          />
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
                <v-avatar v-else :color="project.avatarColor" class="me-3">
                  {{ project.avatarText }}
                </v-avatar>
              </div>

              <div class="px-3 py-1 ">
                <p>{{ project.projectName }}</p>
                <p v-if="project.innName !== ' - '"><small>{{ project.innName }}</small></p>
              </div>

              <div class="ms-auto px-3 pt-3 pb-6 pb-md-3">
                <v-chip color="primary" class='w-100 text-center justify-center' variant="tonal" elevation="1">
                  {{ project.val }}
                </v-chip>
              </div>
            </router-link>
          </div>


        </v-card-text>
      </v-card>
    </v-dialog>

  </v-card>
</template>

<script>
import {Bar} from "vue-chartjs";

export default {
  components: {Bar},
  props: ['title', 'url',],
  data() {
    return {
      isLoading: true,
      isLoadingDialog: false,
      dialogShow: false,
      labelsData: [],
      dialogData: [],
      alertText: '',

      chartData: {
        labels: ['2020', '2021', '2023'],
        datasets: [{
          label:'План',
          data: [40, 20, 12],
          backgroundColor: ['#a4a',]
        }, {
          label:'Факт',
          data: [40, 20, 12],
          backgroundColor: ['#999999',]
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
    async getDashboard() {
      this.isLoading = false
      this.alertText = ''
      try {
        const response = await fetch(this.url, {method: 'get'});
        if (response.status === 200) {
          const data = await response.json();
          this.chartData.labels = data.year;
          this.chartData.datasets[0].data = data.plan;
          this.chartData.datasets[1].data = data.fact;
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
