<template>


  <v-dialog
    persistent
    v-model="core.modalInfo"
    max-width="600"
  >
    <v-card class="br-15 pt-5 px-5">
      <v-card-text>
        <div class="text-center" v-html="core.modalInfoText"></div>
      </v-card-text>
      <v-card-actions class="text-center">
        <v-btn block color="primary" variant="text" class="br-15" @click="core.modalInfo = false"><b>Ок</b></v-btn>
      </v-card-actions>

    </v-card>


  </v-dialog>

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
