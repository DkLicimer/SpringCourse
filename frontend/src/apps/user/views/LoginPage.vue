<template>
  <div class="bg-grey-lighten-4  d-flex flex-1-1 py-10">
    <!-- авторезирован -->
    <v-container v-if="user.userData.username">
      <div>
        <v-card v-if="user.userData.klient" class="br-20 px-7 py-5" elevation="5">
          <div class="mb-3">

<!--            <h1>{{ klient.dvData.fio }}</h1>-->
          </div>
          <div class="d-flex flex-column flex-md-row">

          </div>
        </v-card>
        <v-card v-else class="br-20 px-7 py-5" elevation="5">


          <div class="text-center mb-5 mt-3">
            <!--          <img class="logo mb-3" src="src/assets/logo_pc.png" alt="" >-->
            <h1 class="mb-5">Вы вошли как {{ user.userData.username }}</h1>
          </div>

          <form method="post" class="card-body br-20 forma-vhoda text-center mt-5" action="#">


            <div>
              <v-btn
                elevation="3"
                color="primary"
                class="px-15 mb-3 br-20"
                tile
                @click="user.logout()"
              >
                Выйти
              </v-btn>
            </div>


          </form>

        </v-card>

      </div>
    </v-container>

    <v-container v-else class=" d-flex flex-1-1 justify-center align-self-center">
      <!--    <div class=" text-center d-flex justify-center align-self-center flex-column h-100">-->
      <v-row class=" justify-center align-self-center">
        <v-col cols="12" sm="8" md="5" lg="4" class="">


          <!-- авторизация -->
          <div v-if="loginMode">
            <div class="text-center w-100">
              <v-img class="logo mb-10 mx-auto" width="250" src="@/assets/logo-koval.png" alt=""/>


            </div>

            <div class="mb-6">
              <v-text-field @keydown.enter="user.login" variant="underlined" class="mb-3" v-model="user.formData.login"
                            label="Логин" с/>
              <v-text-field type="password" @keydown.enter="user.login" variant="underlined" v-model="user.formData.pas"
                            label="Пароль"/>
            </div>

            <div class="d-flex mt-10">
              <v-btn variant="text" color="primary" class="me-auto br-15" @click="loginMode = !loginMode">Регистрация
              </v-btn>
              <v-btn color="primary" variant="flat" size="large" class="px-10 br-15" @click="user.login">
                Войти
              </v-btn>
            </div>
          </div>

          <!-- регистрация -->
          <div v-else>
            <div class="text-center w-100">
              <v-img class="logo mb-5 mx-auto" width="150" src="@/assets/logo-koval.png" alt=""/>
            </div>

            <div class="mb-6">
              <v-text-field @keydown.enter="user.registration(formReg)" variant="underlined" class="mb-3"
                            v-model="formReg.fio" label="ФИО*"/>
              <v-text-field @keydown.enter="user.registration(formReg)" variant="underlined" class="mb-3"
                            v-model="formReg.email" label="Email*"/>
              <v-text-field @keydown.enter="user.registration(formReg)" variant="underlined" class="mb-3"
                            v-model="formReg.phone" label="Телефон*"/>
              <v-text-field @keydown.enter="user.registration(formReg)" variant="underlined" class="mb-3"
                            v-model="formReg.address" label="Адрес доставки*"/>
              <v-text-field type="password" @keydown.enter="user.registration(formReg)" variant="underlined"
                            v-model="formReg.pas" label="Пароль*"/>
              <v-text-field type="password" @keydown.enter="user.registration(formReg)" variant="underlined"
                            v-model="formReg.pas2" label="Пароль повторно*"/>
            </div>

            <div class="text-grey-darken-1"><small>*Нажимая "Регистрация" Вы даете согласие на обработку Ваших
              <router-link class="text-primary" target= '_blank' :to="{name:'PrivacyPolicyPage'}">персональных данных</router-link> согласно 152ФЗ</small></div>

            <div class="d-flex mt-10">
              <v-btn variant="text" color="primary" class="me-auto br-15" @click="loginMode = !loginMode">Авторизация
              </v-btn>
              <v-btn color="primary" variant="flat" size="large" class="px-10 br-15"
                     @click="user.registration(formReg)">
                Регистрация
              </v-btn>
            </div>
          </div>

        </v-col>

      </v-row>
    </v-container>

  </div>
</template>

<style scoped>
.logo {
  width: 150px;
}
</style>

<script>

import {useCoreStore} from "@/apps/core/store";
import {useUserStore} from "@/apps/user/store";

export default {
  setup() {
    const core = useCoreStore()
    const user = useUserStore()
    return {
      core,
      user,
    }
  },

  data() {
    return {
      loginMode: true,
      formReg: {},
    }
  },

  created() {

  }


}

</script>
