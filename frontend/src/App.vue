<template>


  <navbar-header v-show="core.isLoad" class="fixed-header"/>

  <app-loader v-if="!core.isLoad"/>


  <router-view></router-view>


  <footer-block class="" v-show="core.isLoad"/>

  <app-snackbar/>
  <modal-loader/>
  <modal-info/>
  <cookie-banner/>

</template>

<script>
import NavbarHeader from "@/apps/core/components/NavbarHeader.vue";
import FooterBlock from "@/apps/core/components/FooterBlock.vue";
import AppLoader from "@/apps/core/components/AppLoader.vue";
import AppSnackbar from "@/apps/core/components/AppSnackbar.vue";
import ModalLoader from "@/apps/core/components/ModalLoader.vue";
import CookieBanner from '@/apps/core/components/CookieBanner.vue';
import {useCoreStore} from "@/apps/core/store";
import {useUserStore} from "@/apps/user/store";
import ModalInfo from "@/apps/core/components/ModalInfo.vue";
import LOCAL_CONFING from "./LOCAL_CONFING";


export default {
  computed: {
    LOCAL_CONFING() {
      return LOCAL_CONFING
    }
  },
  components: {
    ModalInfo,
    ModalLoader,
    AppSnackbar,
    AppLoader,
    NavbarHeader,
    FooterBlock,
    CookieBanner,
  },

  setup() {
    const core = useCoreStore()
    const user = useUserStore()
    return {
      core,
      user,
    }
  },

  async created() {
    await this.user.getCurrentUser();

    this.$router.beforeEach((to, from, next) => {
      if (!to.hash) {
        this.core.isLoad = false
      }
      next()
    })

    this.$router.afterEach(() => {
      setTimeout(() => {
        this.core.isLoad = true
      }, 300)

    })

  },


}

</script>


<style scoped>
.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000; /* Убедитесь, что header находится поверх других элементов */
}

.router-view {
  padding-top: 64px; /* Добавьте отступ, чтобы контент не перекрывался header */
}
</style>
