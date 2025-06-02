import {defineStore} from 'pinia'
import LOCAL_CONFING from "@/LOCAL_CONFING";

import {useCoreStore} from "@/apps/core/store";
import CoreHelper from "@/plugins/coreHelper";

export const useUserStore = defineStore('user', {
  state: () => ({
    userData: {
      username: ''
    },
    formData: {
      login: null,
      pas: null,
    }
  }),

  getters: {
    navigatinList: state => {
      const result = []
      // без авторизации
      if (!state.userData || !state.userData?.pravaList) {
        LOCAL_CONFING.navigationList.forEach(iMenu => {
          if (iMenu.prava === 'vse') {
            result.push(iMenu)
          }
          if (iMenu.prava === 'no_autorize') {
            result.push(iMenu)
          }
        })
        return result
      }

      LOCAL_CONFING.navigationList.forEach(iMenu => {
        for (const iUserPravo of state.userData?.pravaList) {
          if (iMenu.prava?.includes(iUserPravo)) {
            result.push(iMenu)
            break;
          }
          if (iMenu.prava === 'vse') {
            result.push(iMenu)
            break;
          }
        }

      })
      return result
    },
  },

  actions: {
    // авторизация
    async login() {
      const core = useCoreStore()
      if (!this.formData.login) {
        core.showAlertError('Укажите логин')
        return
      }

      if (!this.formData.pas) {
        core.showAlertError('Укажите пароль')
        return
      }

      const response = await fetch(LOCAL_CONFING.urls.login, {
        method: 'post',
        body: JSON.stringify(this.formData),
        headers: CoreHelper.getHeader(),
      });

      if (response.status === 200) {
        const responseJson = await response.json();
        CoreHelper.setCookie('sessionid', responseJson.sessionid, {'max-age': 31536000});
        window.location.href = "/";
      } else {
        core.showAlertError('Ошибка авторизации')
      }

    },

    // регистарция
    async registration(formData) {
      const core = useCoreStore()
      if (!formData.fio) {
        core.showAlertError('Укажите пожалуйста ФИО')
        return
      }

      if (!formData.email) {
        core.showAlertError('Укажите пожалуйста почту')
        return
      }


      if (!formData.phone) {
        core.showAlertError('Укажите пожалуйста телефон')
        return
      }

      if (!formData.address) {
        core.showAlertError('Укажите пожалуйста адрес')
        return
      }

      if (!formData.pas) {
        core.showAlertError('Укажите пароль')
        return
      }

      if (formData.pas2 !== formData.pas) {
        core.showAlertError('Пароли не совпадают')
        return
      }

      const response = await fetch(LOCAL_CONFING.urls.registration, {
        method: 'post',
        body: JSON.stringify(formData),
        headers: CoreHelper.getHeader(),
      });

      if (response.status === 200) {
        const responseJson = await response.json();
        CoreHelper.setCookie('sessionid', responseJson.sessionid, {'max-age': 31536000});
        window.location.href = "/";
      } else {
        core.showAlertError('Ошибка регистрации')
      }

    },

    // разлогин
    logout() {
      CoreHelper.deleteAllCookies()
      location.reload();
    },

    // проверяет авторизацию
    async getCurrentUser() {
      const response = await fetch(LOCAL_CONFING.urls.getCurrentUser, {
        method: 'post',
        headers: CoreHelper.getHeader(),
      });

      if (response.status === 200) {
        this.userData = await response.json();

      } else {
        this.userData = {}
        if (!(location.pathname.includes('/login') || location.pathname.includes('/privacy-policy'))) {
          window.location.href = "/login"
        }
      }

    },

  },
})
