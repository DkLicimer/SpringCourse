<template>
  <div class="flex-1-1 position-relative">

    <div class="d-flex flex-1-1 align-items-center h-100">
      <v-container class="mb-10   ">
        <h1>Отчеты</h1>

        <v-card elevation="3" class="br-15">
          <v-card-text class="px-7 py-7">
            <div class="d-flex">
              <v-select
                item-title="name"
                item-value="id"
                :items="reportType" v-model="report" variant="underlined" class="me-4"></v-select>
              <v-text-field type="date" variant="underlined" label="период с" class="me-4" v-model="dateStart"/>
              <v-text-field type="date" variant="underlined" label="период по" v-model="dateEnd"/>
            </div>

            <v-btn class="mt-5 br-15" color="primary" target="_blank"
                   :href="`${url}?date_start=${dateStart}&date_end=${dateEnd}&report=${report}`"
            >Сформировать
            </v-btn>
          </v-card-text>
        </v-card>
        <v-card elevation="3" class="br-15 mt-5">
          <v-card-text class="px-7 py-7">
            <div class="d-flex">
              <v-text-field type="date" variant="underlined" label="период с" class="me-4"
                            v-model="dateStartDashboard"/>
              <v-text-field type="date" variant="underlined" label="период по" v-model="dateEndDashboard"/>
              <v-btn class="ms-5 br-15" color="primary"
                     @click="reportCounts.apply(dateStartDashboard, dateEndDashboard)"
              >Применить
              </v-btn>
            </div>


          </v-card-text>
        </v-card>

        <v-row class="mt-5">
          <v-col md="4" lg="3">
            <v-card elevation="3" color="green-lighten-5" class="br-15">
              <v-card-text class="px-7 py-7 text-center">
                <h1 class="text-h2">{{ reportCounts.lvData.klientVsego}}</h1>
                <div>Клиентов всего</div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col md="4" lg="3">
            <v-card elevation="3" color="green-lighten-5" class="br-15">
              <v-card-text class="px-7 py-7 text-center">
                <h1 class="text-h2">{{ reportCounts.lvData.pribilVsego }}</h1>
                <div>Прибыль</div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col md="4" lg="3">
            <v-card elevation="3" color="green-lighten-5" class="br-15">
              <v-card-text class="px-7 py-7 text-center">
                <h1 class="text-h2">{{ reportCounts.lvData.pribilPoNaboram }}</h1>
                <div>Прибыль по наборам</div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col md="4" lg="3">
            <v-card elevation="3" color="green-lighten-5" class="br-15">
              <v-card-text class="px-7 py-7 text-center">
                <h1 class="text-h2">{{ reportCounts.lvData.pribilPoBludam }}</h1>
                <div>Прибыль по блюдам</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col md="4" lg="3">
            <v-card elevation="3" color="green-lighten-5" class="br-15">
              <v-card-text class="px-7 py-7 text-center">
                <h1 class="text-h2">{{ reportCounts.lvData.zakazZaPeriod}}</h1>
                <div>Заказов</div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col md="4" lg="3">
            <v-card elevation="3" color="green-lighten-5" class="br-15">
              <v-card-text class="px-7 py-7 text-center">
                <h1 class="text-h2">{{ reportCounts.lvData.zakazovIspolneno }}</h1>
                <div>Заказов со статусом "Исполнено"</div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col md="4" lg="3">
            <v-card elevation="3" color="green-lighten-5" class="br-15">
              <v-card-text class="px-7 py-7 text-center">
                <h1 class="text-h2">{{ reportCounts.lvData.zakazovOtmeneno }}</h1>
                <div>Заказов со статусом "Отменено"</div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col md="4" lg="3">
            <v-card elevation="3" color="green-lighten-5" class="br-15">
              <v-card-text class="px-7 py-7 text-center">
                <h1 class="text-h2">{{ reportCounts.lvData.zakazovNovih }}</h1>
                <div>Заказов со статусом "Новый"</div>
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
import {useCoreStore} from "@/apps/core/store";
import {useReportStore} from "@/apps/otchet/store";

export default {
  setup() {
    const core = useCoreStore()
    const reportCounts = useReportStore()
    return {
      core,
      reportCounts,
    }
  },

  async created() {
    this.$emit('loadComplete',);
    await this.reportCounts.reseatSearch()
  },

  data() {
    return {
      url: LOCAL_CONFING.urls.otcheti,
      dateStart: '',
      dateEnd: '',
      dateStartDashboard: '',
      dateEndDashboard: '',
      report: '',
      reportType: [
        {
          name: 'Отчет по исключениям',
          id: 'alergia_otchet',
        },
        {
          name: 'Отчет по прибыли (клиенты/блюда)',
          id: 'pribil_otchet',
        }
      ]
    }
  },
}

</script>

<style scoped>


</style>

