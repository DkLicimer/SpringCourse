<template>
  <v-layout class="d-block toggle flex-0-0 navbar-header-toggle">
    <v-navigation-drawer
      width="250"
      v-model="drawer"
      class="z-index-top"
      temporary
    >
      <header class="d-flex h-100 flex-column  ">
        <div>
          <v-list-item class="bg-primary">
            <router-link class="text-decoration-none  d-flex justify-center text-white text-center py-1"
                         :to="{name:'HomePage'}">
              <!--              <img class="logo-main " src="../../assets/logo.png" alt="">-->
              <div class="ms-3  text-uppercase text-center text-white"><b>
                Коваль Лайт
              </b></div>
            </router-link>
          </v-list-item>

          <v-divider></v-divider>


          <v-list density="compact" nav>

            <div class="mb-5 text-start" v-for="i in user.navigatinList">
              <v-btn color="primary" variant="text" class="w-100 br-20 text-start justify-start" :to="{name:i.name}"
                     :class='{"v-btn--active":$route.path.includes($router.resolve({name:i.name}).href)}'>
                <v-icon :icon="i.icon" class="me-3"/>
                {{ i.title }}
              </v-btn>
            </div>


          </v-list>
        </div>
        <div class="mt-auto py-2 bg-primary text-start px-5">
          <router-link class="header-link text-decoration-none text-white" :to="{name:'LoginPage'}">
            <v-icon color="white" icon="mdi-account" size="large"/>
            {{ user.userData.username }}

          </router-link>
        </div>
      </header>


    </v-navigation-drawer>
    <v-main class="rounded">
      <div class="d-flex h-100">
        <div class="align-content-center">
          <v-menu>
            <template v-slot:activator="{ props }">
              <div class="me-3 cursor-pointer" v-bind="props">
                {{ gorodNow }}
                <v-icon icon="mdi-menu-down"/>
              </div>
            </template>
            <v-list>
              <v-list-item
                :href="item.url"
                v-for="(item, index) in goroda"
                :key="index"
                :value="index"
              >
                <v-list-item-title>{{ item.name }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
        <v-btn
          color="primary"
          class="br-20"
          @click.stop="drawer = !drawer"
        >
          <svg height="1em" viewBox="0 0 448 512">
            <path fill="#fff"
                  d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"/>
          </svg>
        </v-btn>
      </div>
    </v-main>
  </v-layout>
</template>

<script>

import {useUserStore} from "@/apps/user/store";
import {useCoreStore} from "@/apps/core/store";
import LOCAL_CONFING from "@/LOCAL_CONFING";

export default {
  setup() {
    const user = useUserStore()
    const core = useCoreStore()
    return {
      user,
      core
    }
  },
computed: {
    gorodNow() {
      return this.core.gorodNow
    },
    goroda() {
      return this.core.goroda
    },
  },

  data() {
    return {
      drawer: null,
    }
  },
}
</script>

<style scoped>
.z-index-top {
  z-index: 1000000000 !important;
}
</style>
