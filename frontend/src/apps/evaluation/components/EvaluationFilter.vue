<template>
  <v-row class="mb-1">
    <v-col cols="12" md="3">
      <v-autocomplete
        label="Группа"
        variant="underlined"
        item-title="name"
        item-value="id"
        :items="evaluationStore.groupList"
        v-model="currentGroup"
        clearable
        @update:modelValue="updateFilter"
      />
    </v-col>

    <v-col cols="12" md="3">
      <v-autocomplete
        class="mb-2"
        label="Предмет"
        clearable
        item-title="name"
        item-value="id"
        :items="evaluationStore.subjectList"
        v-model="currentSubject"
        variant="underlined"
        @update:modelValue="updateFilter"
      />
    </v-col>

    <v-col cols="12" md="3">
      <v-select
        class="mb-2"
        label="Дата с"
        clearable
        type="date"
        variant="underlined"
      />
    </v-col>


    <v-col cols="12" md="3">
      <v-select
        class="mb-2"
        label="Дата по"
        clearable
        type="date"
        variant="underlined"
      />
    </v-col>

  </v-row>
</template>

<script>
import {useCoreStore} from "@/apps/core/store";
import {useUserStore} from "@/apps/user/store";
import {useEvaluationStore} from "@/apps/evaluation/store";

export default {
  name: "EvaluationFilter",

  setup() {
    const core = useCoreStore()
    const userStore = useUserStore()
    const evaluationStore = useEvaluationStore()
    return {
      core,
      userStore,
      evaluationStore,
    }
  },

  data: () => ({
    currentGroup: null,
    currentSubject: null,
  }),

  watch: {
    // Синхронизация с хранилищем при изменении фильтров
    'evaluationStore.currentFilters': {
      immediate: true,
      deep: true,
      handler(newFilters) {
        this.currentGroup = newFilters.group
        this.currentSubject = newFilters.subject
      }
    }
  },

  methods: {
    async updateFilter() {
      const filters = {
        group_id: this.currentGroup,
        subject_id: this.currentSubject
      };

      await this.evaluationStore.setFilters(filters);
      await this.evaluationStore.getEvaluationList();

      this.$emit('filter-changed', filters);
    }

  },

  async created() {
    try {
      // Загружаем списки для фильтров
      await Promise.all([
        this.evaluationStore.getGroupList(),
        this.evaluationStore.getSubjectList()
      ]);

      // Инициализируем текущие значения из хранилища
      this.currentGroup = this.evaluationStore.currentFilters.group;
      this.currentSubject = this.evaluationStore.currentFilters.subject;

      this.$emit('load-complete');
    } catch (e) {
      console.error("Error loading filter data:", e);
      this.core.showAlertError("Ошибка загрузки данных фильтра");
    }
  },
}
</script>

<style scoped>
</style>
