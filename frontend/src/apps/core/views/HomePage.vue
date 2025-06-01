<template>
  <div class="flex-1-1 position-relative h-100 align-content-center bg-fon pb-10">

    <!--    <div class="d-flex flex-1-1 align-items-center h-100">-->

    <!--      <video playsinline autoplay muted loop class="video-main"-->
    <!--             alt="https://ru.freepik.com/free-video/close-up-shot-plate-cookies-rotating_2311002#fromView=search&page=3&position=51&uuid=ea53a722-7bbd-4f48-975a-73ded3dbed26 Видео от freepik">-->
    <!--        <source src="@/assets/video2.mp4" type="video/mp4">-->
    <!--      </video>-->
    <!--      <div class="bg-wrap d-flex ">-->

    <!--&lt;!&ndash;        <v-container class="   ">&ndash;&gt;-->
    <!--&lt;!&ndash;          <div class=" text-center d-flex justify-center align-self-center flex-column h-100">&ndash;&gt;-->

    <!--&lt;!&ndash;            <div class="mb-10 ">&ndash;&gt;-->
    <!--&lt;!&ndash;              &lt;!&ndash;              <div class="text-md-h4 text-h6 font-weight-bold mb-3 text-white">КОВАЛЬ ЛАЙТ ERP</div>&ndash;&gt;&ndash;&gt;-->
    <!--&lt;!&ndash;              <div class=""><img class="logo mb-2 px-1 py-1 elevation-3"&ndash;&gt;-->
    <!--&lt;!&ndash;                                 src="@/assets/logo-koval.png" alt=""></div>&ndash;&gt;-->
    <!--&lt;!&ndash;            </div>&ndash;&gt;-->

    <!--&lt;!&ndash;            <div class="d-none d-md-block">&ndash;&gt;-->
    <!--&lt;!&ndash;              <v-row class="d-flex align-center justify-center">&ndash;&gt;-->
    <!--&lt;!&ndash;                <v-col cols="12" md="10" lg="8" xl="6">&ndash;&gt;-->
    <!--&lt;!&ndash;                  <v-row>&ndash;&gt;-->
    <!--&lt;!&ndash;                    <v-col md="4" class="mb-5" v-for="i in user.navigatinList">&ndash;&gt;-->
    <!--&lt;!&ndash;                      <router-link class="text-decoration-none" :to="{name:i.name}" v-if="i.isShowInHome">&ndash;&gt;-->
    <!--&lt;!&ndash;                        <v-btn&ndash;&gt;-->
    <!--&lt;!&ndash;                          elevation="4"&ndash;&gt;-->
    <!--&lt;!&ndash;                          color="primary"&ndash;&gt;-->
    <!--&lt;!&ndash;                          min-width="228"&ndash;&gt;-->
    <!--&lt;!&ndash;                          class="br-100 px-5 btn-na-glavnoi"&ndash;&gt;-->


    <!--&lt;!&ndash;                          :variant="i.homeVariant"&ndash;&gt;-->
    <!--&lt;!&ndash;                        >&ndash;&gt;-->
    <!--&lt;!&ndash;                          <v-icon&ndash;&gt;-->
    <!--&lt;!&ndash;                            :icon="i.icon"&ndash;&gt;-->
    <!--&lt;!&ndash;                            size="large"&ndash;&gt;-->
    <!--&lt;!&ndash;                            start&ndash;&gt;-->
    <!--&lt;!&ndash;                          />&ndash;&gt;-->

    <!--&lt;!&ndash;                          {{ i.title }}&ndash;&gt;-->
    <!--&lt;!&ndash;                        </v-btn>&ndash;&gt;-->
    <!--&lt;!&ndash;                      </router-link>&ndash;&gt;-->
    <!--&lt;!&ndash;                    </v-col>&ndash;&gt;-->
    <!--&lt;!&ndash;                  </v-row>&ndash;&gt;-->
    <!--&lt;!&ndash;                </v-col>&ndash;&gt;-->

    <!--&lt;!&ndash;              </v-row>&ndash;&gt;-->
    <!--&lt;!&ndash;            </div>&ndash;&gt;-->
    <!--&lt;!&ndash;          </div>&ndash;&gt;-->
    <!--&lt;!&ndash;        </v-container>&ndash;&gt;-->
    <!--      </div>-->
    <!--    </div>-->
    <div class="h-100 align-self-center justify-center">
      <v-container class="d-flex flex-1-1 align-items-center ">
        <div class=" text-center w-100 d-flex justify-center align-self-center flex-column h-100">

          <div class="mb-10 ">
            <!--              <div class="text-md-h4 text-h6 font-weight-bold mb-3 text-white">КОВАЛЬ ЛАЙТ ERP</div>-->
            <div class="text-center"><img class="logo mb-2 px-1 py-1 mx-auto "
                               src="@/assets/logo-koval.png" alt=""></div>
          </div>

          <div class=" d-md-block">
            <v-row class="d-flex align-center justify-center">
              <v-col cols="12" md="10" lg="8" xl="6">
                <v-row :class="{ 'justify-center': shouldJustifyCenter }">
                  <v-col md="4" class="mb-5" v-for="i in user.navigatinList">
                    <router-link class="text-decoration-none" :to="{name:i.name}" v-if="i.isShowInHome">
                      <v-btn
                        elevation="6"
                        color="primary"
                        min-width="228"
                        class="br-100 px-5 btn-na-glavnoi bg-white"
                        variant="flat"
                      >
                        <v-icon
                          :icon="i.icon"
                          size="large"
                          start
                        />

                        {{ i.title }}
                      </v-btn>
                    </router-link>
                  </v-col>
                </v-row>
              </v-col>

            </v-row>
          </div>
        </div>
      </v-container>
    </div>
  </div>
</template>

<script>

import {useUserStore} from "@/apps/user/store";
import {useCoreStore} from "@/apps/core/store";

export default {

  setup() {
    const user = useUserStore()
    const core = useCoreStore()
    return {
      user,
      core,
    }
  },

    computed: {
    // Проверяем, нужно ли добавлять класс justify-center
    shouldJustifyCenter() {
      return this.user.navigatinList.length < 3;
    },
  },

}

</script>

<style scoped>

.bg-fon{
  background-image: url("@/assets/fon2.png");
  background-position: center;
  background-repeat: repeat;
  background-size: contain;
  background-color: #efefef
}

.video-main {
  width: 100%;

  min-height: calc(100vh - 70px);
  object-fit: cover;
}

.bg-wrap {
  width: 100%;
  position: absolute;
  top: 0px;
  right: 0px;
  bottom: 0px;
  left: 0px;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 10;
}

.logo {
  width: 280px;
  @media (min-width: 992px) {
    width: 540px;
  }
}

.btn-na-glavnoi {
  --v-btn-size: 1.125rem;
  --v-btn-height: 52px;
  font-size: var(--v-btn-size);
  min-width: 92px;
  padding: 0 24px;

  @media (max-width: 600px) {
    --v-btn-size: 1rem;
    --v-btn-height: 40px;
    font-size: var(--v-btn-size);
    padding: 0 12px;
  }
}
</style>

