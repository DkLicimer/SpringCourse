import {defineStore} from 'pinia';
import {useCoreStore} from '@/apps/core/store';
import CoreHelper from '@/plugins/coreHelper';
import LOCAL_CONFING from '@/LOCAL_CONFING';

const core = useCoreStore();

export const useReportStore = defineStore('report', {
  state: () => ({
    lvData: {
      'klientVsego': 0,
      'zakazZaPeriod': 0,
      'zakazovIspolneno': 0,
      'zakazovOtmeneno': 0,
      'zakazovNovih': 0,
      'pribilVsego': 0,
      'pribilPoNaboram': 0,
      'pribilPoBludam': 0,
    },
  }),
  actions: {
    async apply(dateStartDashboard, dateEndDashboard) {
      core.modalLoad = true;
      try {
        const response = await fetch(LOCAL_CONFING.urls.report + '/get', {
          method: 'post',
          body: JSON.stringify({startDate: dateStartDashboard, endDate: dateEndDashboard}),
          headers: CoreHelper.getHeader(),
        });

        if (response.ok) {
          const responseJson = await response.json();
          console.log('Response from server:', responseJson);
          this.lvData = responseJson;
        } else {
          core.showAlertError('Ошибка. Подробности в консоли или в логах');
          console.error('Server response error:', response.statusText);
        }
      } catch (error) {
        core.showAlertError('Произошла ошибка при получении данных');
        console.error('Fetch error:', error);
      } finally {
        core.modalLoad = false;
      }
    },
    async reseatSearch() {
      await this.apply(null, null);
    },
  },
});
