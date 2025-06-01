<template>


  <v-dialog
    v-model="core.modalLoad"
    max-width="180"
  >
    <v-list
      class="py-2"
      color="primary"
      elevation="12"
      rounded="lg"
    >
      <v-list-item
        prepend-icon="$vuetify-outline"
        title="Я задумалась..."
      >
        <template v-slot:prepend>
          <div class="pe-4">
            <v-progress-circular
              color="primary"
              indeterminate="disable-shrink"
              size="25"
              width="2"
            ></v-progress-circular>
          </div>
        </template>


      </v-list-item>
    </v-list>
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
