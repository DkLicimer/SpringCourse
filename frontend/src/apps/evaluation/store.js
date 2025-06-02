import {defineStore} from 'pinia';
import {useCoreStore} from '@/apps/core/store';
import CoreHelper from '@/plugins/coreHelper';
import LOCAL_CONFING from '@/LOCAL_CONFING';

const core = useCoreStore();

export const useEvaluationStore = defineStore('evaluation', {
  state: () => ({
    groupList: [],
    subjectList: [],
    evaluationList: [],
    currentFilters: {
      group_id: null,
      subject_id: null
    }
  }),

  getters: {
    filteredEvaluations: (state) => {
      let evaluations = state.evaluationList;

      if (state.currentFilters.group_id) {
        evaluations = evaluations.filter(e => e.group_id === state.currentFilters.group_id);
      }

      if (state.currentFilters.subject_id) {
        evaluations = evaluations.filter(e => e.subject_id === state.currentFilters.subject_id);
      }

      return evaluations;
    }

  },

  actions: {
    async setFilters(filters) {
      this.currentFilters = {...this.currentFilters, ...filters};
      await this.getEvaluationList();
    },

async getScheduleStatistics(scheduleId) {
  core.modalLoad = true;
  try {
    const response = await fetch(`${LOCAL_CONFING.urls.evaluation}/${scheduleId}/`, {
      method: 'get',
      headers: CoreHelper.getHeader(),
    });

    if (response.status === 200) {
      const responseJson = await response.json();
      return responseJson.data;
    } else {
      core.showAlertError('Ошибка при получении статистики');
      return null;
    }
  } catch (error) {
    core.showAlertError('Ошибка сети при получении статистики');
    return null;
  } finally {
    core.modalLoad = false;
  }
},
    async getScheduleEvaluations(scheduleId) {
  core.modalLoad = true;
  try {
    const response = await fetch(`${LOCAL_CONFING.urls.evaluation}/get/${scheduleId}`, {
      method: 'post',
      headers: CoreHelper.getHeader()
    });

    if (response.status === 200) {
      const responseJson = await response.json();
      return responseJson.data;  // список отзывов
    } else {
      core.showAlertError('Ошибка при получении отзывов');
      return [];
    }
  } catch (error) {
    core.showAlertError('Ошибка сети при получении отзывов');
    return [];
  } finally {
    core.modalLoad = false;
  }
},

    async getGroupList() {
      core.modalLoad = true;
      try {
        const response = await fetch(LOCAL_CONFING.urls.referenceTable + '/get_group_list', {
          method: 'post',
          headers: CoreHelper.getHeader(),
        });

        if (response.status === 200) {
          const responseJson = await response.json();
          this.groupList = responseJson.data;
        } else {
          core.showAlertError('Ошибка при загрузке списка групп');
        }
      } catch (error) {
        core.showAlertError('Ошибка сети при загрузке списка групп');
      } finally {
        core.modalLoad = false;
      }
    },

    async getSubjectList() {
      core.modalLoad = true;
      try {
        const response = await fetch(LOCAL_CONFING.urls.referenceTable + '/get_subject_list', {
          method: 'post',
          headers: CoreHelper.getHeader(),
        });

        if (response.status === 200) {
          const responseJson = await response.json();
          this.subjectList = responseJson.data;
        } else {
          core.showAlertError('Ошибка при загрузке списка предметов');
        }
      } catch (error) {
        core.showAlertError('Ошибка сети при загрузке списка предметов');
      } finally {
        core.modalLoad = false;
      }
    },

    async getEvaluationList(filters = {}) {
      core.modalLoad = true;
      try {
        const requestBody = {};

        // Добавляем фильтры только если они есть
        if (filters.group || this.currentFilters.group) {
          requestBody.group_id = filters.group || this.currentFilters.group;
        }

        if (filters.subject || this.currentFilters.subject) {
          requestBody.subject_id = filters.subject || this.currentFilters.subject;
        }

        const response = await fetch(LOCAL_CONFING.urls.schedule + '/get', {
          method: 'post',
          headers: CoreHelper.getHeader(),
          body: JSON.stringify(requestBody)
        });

        if (response.status === 200) {
          const responseJson = await response.json();
          this.evaluationList = responseJson.data;
        } else {
          core.showAlertError('Ошибка при загрузке оценок');
        }
      } catch (error) {
        core.showAlertError('Ошибка сети при загрузке оценок');
      } finally {
        core.modalLoad = false;
      }
    },

    async getEvaluationById(id) {
  core.modalLoad = true;
  try {
    const response = await fetch(`${LOCAL_CONFING.urls.evaluation}/get/${id}`, {
      method: 'get',
      headers: CoreHelper.getHeader()
    });

    if (response.status === 200) {
      const responseJson = await response.json();
      return responseJson.data; // объект оценки
    } else {
      core.showAlertError('Ошибка при загрузке оценки');
      return null;
    }
  } catch (error) {
    core.showAlertError('Ошибка сети при загрузке оценки');
    return null;
  } finally {
    core.modalLoad = false;
  }
}

  },
});
