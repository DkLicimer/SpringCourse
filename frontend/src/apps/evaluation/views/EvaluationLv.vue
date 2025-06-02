<template>

  <v-container class="pt-7 pb-0 mb-auto">

    <div class="d-flex mb-5">
      <h1 class="text-h4"><b>Оценки занятий</b></h1>
    </div>


    <v-card class="px-7 py-7 br-20" elevation="5">
      <v-progress-linear
        v-if="!isLoad"
        :indeterminate="true"
        color="primary"
        class="mb-0"
      ></v-progress-linear>


    <evaluation-filter
      @filter-changed="handleFilterChange"
      @load-complete="loadEvaluations"
    />

      <evaluation-table :evaluations="filteredEvaluations"/>


      <v-progress-linear
        v-if="!isLoad"
        :indeterminate="true"
        color="primary"
        class="mb-0"
      ></v-progress-linear>
    </v-card>


    <div class="d-block d-md-flex">
      <!--      <v-pagination-->
      <!--        v-if="projects.length"-->
      <!--        v-model="filterAndSort.page"-->
      <!--        class="mt-4 mb-4"-->
      <!--        size="small"-->

      <!--        color="primary"-->
      <!--        elevation="2"-->
      <!--        total-visible="6"-->
      <!--        :length="pageCount"-->
      <!--      ></v-pagination>-->

      <div class="ms-auto text-center ">
        <div>
          <v-btn @click="searchAll()" variant="text" color="primary" size="small" class="br-20 px-5 mt-3">Показать все
          </v-btn>
        </div>
        <div>
          <v-alert variant="text" color="grey-darken-1"><small>Найдено: {{ countNow }} шт.</small></v-alert>
        </div>
      </div>
    </div>

  </v-container>


</template>

<script>

import EvaluationTable from "@/apps/evaluation/components/EvaluationTable.vue";
import {useEvaluationStore} from "@/apps/evaluation/store";
import {useUserStore} from "@/apps/user/store";
import EvaluationFilter from "@/apps/evaluation/components/EvaluationFilter.vue";

export default {
  setup() {
    const evaluationStore = useEvaluationStore()
    const user = useUserStore()
    return {
      evaluationStore,
      user,
    }
  },
  components: {EvaluationFilter, EvaluationTable},
  data: () => ({
    countAll: 0,
    countNow: 0,
    isLoad: false,
    alertText: '',
    pageCount: 0,
    filterAndSort: {
      page: 1,
      limit: 10,
      sortOrder: 'up',
      sortName: 'id',
    },
  }),

  async created() {
    this.$emit('loadComplete',);
    this.isLoad = true;
    this.evaluation.getEvaluationList()
    this.$router.beforeEach((to, from, next) => {
      if (!to.hash && to.path !== from.path) {  // если изменился path, а не только хэш
        this.isLoad = false;
      }
      next();
    });
  },

  methods: {

    async searchAll() {
      this.filterAndSort.limit = 1000;
      this.filterAndSort.page = 1;
      await this.getData();
    },

    async getData() {
      this.isLoad = false
      this.alertText = '';
    },


    async search(searchData) {
      this.filterAndSort.page = 1;

      if (searchData) {
        this.filterAndSort.isArchive = searchData.isArchive || 0;
        this.filterAndSort.subject = searchData.subject || '';
        this.filterAndSort.group = searchData.group || '';
      }

      await this.getData()
    },


    setSort(sortData) {
      this.filterAndSort.sortName = sortData.sortName;
      this.filterAndSort.sortOrder = sortData.sortOrder;
      this.getData();
    },
    handleFilterChange(filters) {
      this.evaluationStore.setFilters(filters);
    },

    loadEvaluations() {
      this.evaluationStore.getEvaluationList();
    }
  },
  computed: {
    filteredEvaluations() {
      return this.evaluationStore.filteredEvaluations;
    }
  },

  watch: {
    'filterAndSort.page'() {
      this.getData();
    },
  }

}
</script>
