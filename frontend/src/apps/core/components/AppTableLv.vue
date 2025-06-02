<template>
  <div>
    <div>
      <v-table
        v-if="store.lvData.length"
        hover=""
        class="text-body-2 cursor-pointer w-100 text-center overflow-x-auto "
      >
        <thead>
        <tr>

          <th class="text-center bg-green-lighten-5 align-center justify-center  "
              @click="store.updateSort(itemHeader.orederName)"
              v-for="itemHeader in store.tableHeader"
              :key="itemHeader.name">
            {{ itemHeader.label }}
            <template v-if="store.searchAndSort.sortName === itemHeader.orederName">
              <v-icon v-if="store.searchAndSort.sortOrder === 'up'" icon="mdi-sort-ascending"/>
              <v-icon v-if="store.searchAndSort.sortOrder === 'down'" icon="mdi-sort-descending"/>
            </template>
          </th>


          <th class="text-center bg-green-lighten-5"></th>

        </tr>
        </thead>
        <tbody class="overflow-x-auto">

        <tr

          v-for="i in store.lvData"
          :key="i.id"
        >


          <td class="text-center " @click="open(i.id)" v-for="(itemHeader, index) in store.tableHeader"
              :key="itemHeader.name">
            <div :style='`width:${itemHeader.width}`'
                 class="text-decoration-none  d-flex align-center py-2 h-100 mx-auto">

              <div v-if="index ===0 && i.isArchive">
                <div class="me-3">

                  <v-icon icon="mdi-archive" color="red" size="small"/>

                  <v-tooltip
                    activator="parent"
                    location="top"
                  >В архиве
                  </v-tooltip>
                </div>

              </div>

              <!-- число -->
              <div v-if="itemHeader.type==='num'" class="w-100">
                <template v-if="i[itemHeader.name] || i[itemHeader.name] === 0">
                  {{ i[itemHeader.name].toLocaleString('ru-RU', {'maximumFractionDigits': 2}) }}
                </template>
                <template v-else>
                  -
                </template>
              </div>

              <!-- логическое -->
              <div class="w-100" v-else-if="itemHeader.type==='bool'">
                <v-chip size="small" color="primary" class="px-5" v-if="i[itemHeader.name]">Да</v-chip>
                <v-chip color="secondary" size="small" class="px-5" v-else>Нет</v-chip>
              </div>

              <!-- фото -->
              <div v-else-if="itemHeader.type==='img'"
                   class="text-decoration-none text-black mx-auto px-0 py-2 d-flex">
                <img :style="`height:${itemHeader.width}`" class="br-20 w-100 " :src="i[itemHeader.name]"
                     v-if="i[itemHeader.name]"/>
                <div class="w-100 py-3" v-else>Нет</div>
              </div>

              <!-- текст -->
              <div class="w-100" v-else>
                <div v-if=" i[itemHeader.name]"> {{ i[itemHeader.name] }}</div>

                <div class="w-100 py-3" v-else>Нет</div>
              </div>
            </div>
          </td>


          <!-- меню кнопки -->
          <td>
            <v-menu
              v-if="!user.userData.isPovar && !user.userData.isKurer && !(isBluda && user.userData.isFranchisee)"
              location="start"
            >
              <template v-slot:activator="{ props }">
                <div class=" ">
                  <v-btn elevation="3" variant="text" size="small" class="br-20 " v-bind="props">
                    <v-icon icon="mdi-menu"/>
                  </v-btn>
                </div>
              </template>

              <v-card min-width="300" class="">
                <v-list>

                  <v-list-item
                    v-if="i.isArchive"
                    @click="store.delete(i.id)"
                    title="Убрать из архива"
                  ></v-list-item>

                  <v-list-item
                    v-if="!i.isArchive "
                    @click="store.delete(i.id)"
                    title="Поместить в архив"
                  ></v-list-item>

                  <v-list-item v-if="btnCopy"
                               @click="store.copy(i.id)"
                               title="Копировать"
                  ></v-list-item>
                </v-list>
              </v-card>
            </v-menu>
          </td>

        </tr>

        </tbody>
      </v-table>

      <v-alert
        v-else
        icon="$info"
        class="br-20"
        color="secondary"
        variant="tonal"
        :elevation="4"
      ><b>Ничего не найдено</b>
        <v-btn size="small" variant="tonal" color="primary" class="br-20 ms-3"
               @click="store.reseatSearch()">Сбросить фильтры
        </v-btn>
      </v-alert>
    </div>


  </div>

</template>

<script>


import {useCoreStore} from "@/apps/core/store";
import router from "@/router";
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

  methods: {
    open(id) {
      if (this.openUrl) {
        router.push({name: 'KlientDvPage', params: {id: id}})
        //   const routeData = this.$router.resolve({name: 'KlientDvPage', params: {id: id}});
        // window.open(routeData.href, '_blank');
      } else {
        this.store.openBaseModal(id)
      }
    }
  },

  props: ['store', 'openUrl', 'btnCopy', 'isBluda']


}
</script>

<style scoped>

</style>
