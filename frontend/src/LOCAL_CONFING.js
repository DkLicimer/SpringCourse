let baseUrl = 'http://127.0.0.1:8000';
// let baseUrl = '';
let apiUrl1 = `${baseUrl}/api1`;

export default {

  urls: {
    login: `${apiUrl1}/user/login`,
    registration: `${apiUrl1}/user/registration`,
    getCurrentUser: `${apiUrl1}/user/get_current_user`,

    report: `${apiUrl1}/report`,
    otcheti: `${apiUrl1}/report/otcheti`,
  },

  navigationList: [
    {
      title: 'Войти',
      name: 'LoginPage',
      isShowInHeader: false,
      isShowInHome: true,
      prava: 'no_autorize',
      icon: 'mdi-login',
      homeVariant: 'outlined'
    },
    {
      title: 'Отчеты',
      name: 'OtchetLvPage',
      isShowInHeader: true,
      isShowInHome: true,
      prava: 'is_superuser',
      icon: 'mdi-chart-bar',
      homeVariant: 'outlined'
    },
  ],
}
