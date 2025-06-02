<template>
  <div>
    <v-snackbar
      v-model="core.snackbarShow"
      :color="core.snackbarMessage.color"
    >
      <span class="text-dark">{{ core.snackbarMessage.text }}</span>

      <template v-slot:actions>
        <v-btn

          color="white"
          variant="tonal"
          class="br-20"

          @click="core.snackbarShow=false"
        >
          <b>Ок</b>
        </v-btn>
      </template>

    </v-snackbar>
  </div>
</template>

<script>

import {useCoreStore} from "@/apps/core/store";

export default {
  setup() {
    const core = useCoreStore()
    return {
      core
    }
  },


}
</script>

<style scoped>

</style>
