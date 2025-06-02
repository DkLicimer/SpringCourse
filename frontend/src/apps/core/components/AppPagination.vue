<template>
  <div class="mt-3">
    <div class="text-end px-5 text-grey-darken-1"><small>Найдено: {{ store.itemsCount }} шт.</small></div>
    <div class="d-block d-md-flex" v-if="store.pageCount > 0">

      <v-pagination
        v-model="store.searchAndSort.page"
        class=""
        size="small"

        color="primary"
        elevation="2"
        total-visible="1"
        :length="store.pageCount"
      ></v-pagination>

      <div class="ms-auto text-center align-self-center mt-4 mt-md-0">
        <v-btn elevation="3" variant="outlined" color="primary" size="small" class="br-20 px-5 "
               @click="store.getAll()">Показать все
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>

import {useCoreStore} from "@/apps/core/store";


export default {
  setup() {
    const core = useCoreStore()
    return {
      core,
    }
  },

  props:['store'],


  watch: {
    'store.searchAndSort.page'() {
      this.store.getLvData()
    }
  },
}
</script>

<style scoped>

</style>
