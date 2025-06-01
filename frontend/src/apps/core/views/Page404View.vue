<template>
  <v-container class="mb-10  d-flex flex-1-1 justify-center align-self-center">
    <div class=" text-center d-flex justify-center align-self-center flex-column h-100">
      <div class="page-404 text-primary"><b>404</b></div>
      <h1 class="h4 mb-10 text-primary">cтраница не найдена</h1>
      <div class="mb-2">страница, на которую вы пытаетесь<br>попасть, не существует или была удалена.</div>
      <div class="mt-3">
        <router-link class="btn btn-primary text-decoration-none br-20 btn-sm" :to="{name:'HomePage'}">
          <v-btn

            color="primary"
            min-width="228"
            elevation="4"

            class="br-20"
          >
            Перейти на главную
          </v-btn>
        </router-link>
      </div>
    </div>
  </v-container>
</template>

<script>


export default {
  props: ['user'],
  async created() {

    this.$emit('loadComplete',);
  },

}

</script>


<style lang="scss" scoped>
.page-404 {
  font-size: 30vw;
  @media (min-width: 600px) {
    font-size: 25vw;
  }
  line-height: 1;
  @media(min-width: 960px) {
    font-size: 10vw;
  }
}
</style>
