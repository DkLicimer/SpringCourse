<template>
<div class="d-md-flex mb-5" v-if="projectsChips">
        <v-chip @click="changeStatus('')" variant="elevated" class="px-3 me-3 mb-3 mb-md-0 chip-filter"
                :color="chipColor('')" elevation="5">Всего: {{ countAll }} шт.
        </v-chip>
        <v-chip v-if="userStore.user.role <= 2" @click="changeStatus('moiProekti')" variant="elevated" class="px-3 me-3 mb-3 mb-md-0 chip-filter"
                :color="chipColor('moiProekti')" elevation="5">Мои проекты: {{ moiProektiCount }} шт.
        </v-chip>
        <v-chip @click="changeStatus(0)" variant="elevated" class="mb-3 px-3 me-3 chip-filter" :color="chipColor(0)"
                elevation="5">Без статуса: {{ projectsChips.statusNull }} шт.
        </v-chip>
        <v-chip
          @click="changeStatus(projectChip.id)"
          variant="elevated" class="px-3 me-3 chip-filter mb-3" :color="chipColor(projectChip.id)"
          elevation="5"
          v-for="projectChip in projectsChips.statusItems"
          :key="projectChip.id">
          {{ projectChip.name }}:
          {{ projectChip.count }} шт.
        </v-chip>


      </div>
</template>

<script>
import {useUserStore} from "@/store/user";

export default {
  props:['projectsChips', 'projectStatus', 'countAll', 'moiProektiCount'],

    setup() {
    const userStore = useUserStore()
    return {
      userStore,
    }
  },

  methods:{
    changeStatus(id){
      this.$emit('changeStatus', id)
    },

    chipColor(id) {
      return this.projectStatus === id ? 'primary' : 'white'
    },
  }
}
</script>

<style scoped>

</style>
