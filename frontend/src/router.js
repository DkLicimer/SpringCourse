// Composables
import {createRouter, createWebHistory} from 'vue-router'

const routes = [

  {
    path: '/',
    name: 'HomePage',
    component: () => import( '@/apps/core/views/HomePage.vue'),
  },
  {
    path: '/otchet',
    name: 'OtchetLvPage',
    component: () => import( '@/apps/otchet/views/OtchetLvPage.vue'),
  },
  {
    path: '/login',
    name: 'LoginPage',
    component: () => import( '@/apps/user/views/LoginPage.vue'),
  },
  {
    path: '/privacy-policy',
    name: 'PrivacyPolicyPage',
    component: () => import( '@/apps/core/views/PrivacyPolicyPage.vue'),
  },

  {
    path: '/:catchAll(.*)',
    name: 'Page404View',
    component: () => import( '@/apps/core/views/Page404View.vue'),
  },

]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior: function (to,) {
    if (to.hash) {
      return {selector: to.hash}

    } else {
      return {x: 0, y: 0}
    }
  },
})


export default router
