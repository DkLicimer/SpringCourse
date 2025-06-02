<template>
  <div>
    <v-menu
      v-model="searchMenu"
      :close-on-content-click="false"
      scrim

      location="start"
    >
      <template v-slot:activator="{ props }">
        <v-btn elevation="3" color="primary" :size="size ?? undefined" variant="outlined" class="br-20" v-bind="props">
          <v-icon icon="mdi-magnify"/>
        </v-btn>
      </template>

      <v-card min-width="300" class="app-poisk br-15">
        <v-card-text class="pb-1">
          <h3 class="mb-4">Фильтры</h3>

          <div v-for="(i, index) in store.searchList"
               :key="i.label">

            <label for="" class="text-grey-darken-1">{{ i.label }}</label>
            <v-text-field
              v-if="i.type==='text'"
              @keydown.enter="search()"
              :clearable="i.clearable ?? true"
              class="pt-0 br-20 mb-3 mt-0"
              variant="outlined"

              v-model="store.searchAndSort[i.model]"
            />
            <v-text-field
              v-if="i.type==='date'"
              @keydown.enter="search()"
              :clearable="i.clearable ?? true"
              type="date"
              class="pt-0 br-20 mb-3 mt-0"
              variant="outlined"
              v-model="store.searchAndSort[i.model]"
            />


            <v-select
              v-if="i.type==='select'"
              class="mb-2 mt-2"
              :item-title="i.itemTitle"
              :item-value="i.itemVaile"
              variant="outlined"
              v-model="store.searchAndSort[i.model]"
              :items="i.items"
            />

            <v-autocomplete
              v-if="i.type==='autocomplete'"
              class="mb-2 mt-2"
              :item-title="i.itemTitle"
              :item-value="i.itemVaile"
              variant="outlined"
              v-model="store.searchAndSort[i.model]"
              :items="i.items"
            />

          </div>

        </v-card-text>

        <v-card-actions class="d-flex">
          <v-btn

            color="secondary"
            variant="text"
            class=" br-20"
            @click="reset()"
          >
            Сбросить
          </v-btn>

          <v-btn
            color="primary"
            variant="text"
            class="ms-auto br-20 "
            @click="search()"

          >
            Применить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
import {useCoreStore} from "@/apps/core/store";
import {useBludaStore} from "@/apps/bluda/store";

export default {
  setup() {
    const core = useCoreStore()
    return {
      core,
    }
  },

  props: ['store', 'size'],


  data() {
    return {
      searchMenu: false,
    }
  },

  watch: {
    searchMenu(newValue, oldValue) {
      if (newValue === false) {
        this.store.getLvData()
      }
    }
  },


  methods: {
    search() {
      this.searchMenu = false;
    },

    reset() {
      this.store.reseatSearch()
      this.searchMenu = false;
    }
  },
}
</script>

<style scoped>


</style>
