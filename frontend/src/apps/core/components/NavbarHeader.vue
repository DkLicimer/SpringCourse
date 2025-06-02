<template>

  <header class="header text-white position-sticky top-0 py-4 elevation-5 bg-primary">
    <v-container class="py-0">
      <v-row>
        <v-col cols="12">
          <div class="d-flex align-center">
            <div class="me-md-5 me-auto">
              <router-link class="logo-main text-decoration-none d-flex text-white justify-end" :to="{name:'HomePage'}"
              >
                <img class="logo-header " src="@/assets/poleno.png" alt="">

              </router-link>


            </div>


            <div class="d-md-flex ms-3 d-none">

              <div class="me-4" v-for="i in user.navigatinList">
                <router-link v-if="i.isShowInHeader" class="header-link text-decoration-none text-body-1 text-uppercase" :to="{name:i.name}"
                             :class='{"router-link-active":$route.path.includes($router.resolve({name:i.name}).href)}'>
                  {{ i.title }}
                </router-link>
              </div>

            </div>


            <div class="ml-auto d-none d-md-flex me-5 me-md-0 ">


              <router-link class="header-link text-decoration-none text-body-1 align-center d-flex justify-center text-white" :to="{name:'LoginPage'}">
                <v-icon color="white" icon="mdi-account"/>
                {{ user.userData.username }}

              </router-link>
            </div>
            <navbar-header-toggle class="d-md-none"/>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </header>
</template>


<script>
import NavbarHeaderToggle from "@/apps/core/components/NavbarHeaderToggle.vue";
import {useUserStore} from "@/apps/user/store";
import {useCoreStore} from "@/apps/core/store";

export default {
  components: {
    NavbarHeaderToggle,
  },

  mounted() {
  },

  computed: {
  },

  setup() {
    const user = useUserStore()
    const core = useCoreStore()
    return {
      user,
      core
    }
  },
}
</script>

<style scoped lang="scss">

.header {
  .header-link {
    color: #ccc !important;

    &:hover {
      color: #fff !important;
    }
  }

  .router-link-active {
    color: #fff !important;
  }
}


.logo-main {
  height: 35px;
}


.logo-header {
  height: 40px;
}
</style>
