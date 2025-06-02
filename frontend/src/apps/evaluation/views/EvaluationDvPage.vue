<template>
  <div class="flex-1-1 position-relative">

    <div class="d-flex flex-1-1 align-items-center h-100">
      <v-container class="mb-10   ">
        <h1>Отчет занятия</h1>

        <v-row class="mt-5">
          <v-col cols="12">
            <v-card elevation="3" color="green-lighten-5" class="br-15">
              <v-card-text class="px-7 py-7">
                <h1 class="text-h4 font-weight-bold">Остались вопросы:</h1>
                <div v-for="item in evaluationList['data']" :key="item.id" class="text-h6">- {{ item.questions }}</div>
              </v-card-text>
            </v-card>
            {{evaluationList}}
            <v-card v-if="evaluationList && evaluationList.length > 0" class="mt-6 pa-4" elevation="2">
              <h2>Отзывы</h2>
              <div v-for="(item, index) in evaluationList" :key="index" class="mb-4">
                <p><strong>Группа:</strong> {{ item.group_label }}</p>
                <p><strong>Предмет:</strong> {{ item.subject_label }}</p>
                <p><strong>Дата:</strong> {{ item.date }}</p>
                <p><strong>Рекомендации:</strong> <span v-html="item.recommendations"></span></p>
                <v-divider class="my-4"/>
              </div>
            </v-card>


          </v-col>
          <v-col cols="12">
            <div class="d-flex ga-2 justify-center">
              <v-chip color="primary" size="large" variant="tonal">
                Медленно
              </v-chip>
              <v-chip color="primary" size="large" variant="tonal">
                Непонятно
              </v-chip>
              <v-chip color="primary" size="large" variant="tonal">
                Интересно
              </v-chip>
              <v-chip color="primary" size="large" variant="tonal">
                Домашка
              </v-chip>
              <v-chip color="primary" size="large" variant="tonal">
                Скорость
              </v-chip>
            </div>
          </v-col>
          <v-col md="6">
            <dashbord-bar
              title="Материал"
              :url="`${url}/obem_invest_po_otrosliam`"
            />
          </v-col>
          <v-col md="6">
            <v-card elevation="3" color="green-lighten-5" class="br-15">
              <v-card-text class="px-7 py-7 text-center">
                <div>Интерес</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col md="6">
            <v-card elevation="3" color="green-lighten-5" class="br-15">
              <v-card-text class="px-7 py-7 text-center">
                <div>Эмоции</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script>

import LOCAL_CONFING from "@/LOCAL_CONFING";
import DashbordBar from "@/apps/core/components/dasboard/DashbordBar.vue";

export default {
  components: {DashbordBar},
  async created() {
    await this.getSchedule();

    this.$emit('loadComplete',);
    this.report.getGroupList()
    this.report.getSubjectList()
  },

  methods: {
    async getSchedule() {
      this.$emit('loadStart',);
      this.isLoading = false
      this.alertText = null
      const url = `${LOCAL_CONFING.urls.schedule}/get/${this.$route.params.id}`;
      try {
        const response = await fetch(url, {method: 'post'});
        if (response.status === 404) {
          window.location.href = "/404"
          this.$emit('showAlert', {'color': 'red', text: 'Проект не найден или нет прав'});
        }
        this.evaluationList = await response.json();
      } catch (e) {
        this.$emit('showAlert', {'color': 'red', text: 'Ошибка при обращение к серверу'});
        this.alertText = 'Ошибка при обращение к серверу. Подробности в консоли';
      }
      this.isLoading = true
      this.$emit('loadComplete',);


    },
  },

  data() {
    return {
      url: LOCAL_CONFING.urls.otcheti,
      dateStart: '',
      dateEnd: '',
      currentGroup: null,
      currentSubject: null,
      evaluation: null,
      statistics: null,
      evaluationList: [],
    }
  },
}

</script>

<style scoped>


</style>

