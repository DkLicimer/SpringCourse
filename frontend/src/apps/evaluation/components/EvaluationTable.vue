<template>
  <div>
    <v-table
      v-if="evaluations"

      hover=""
      class="text-body-2 cursor-pointer w-100"

    >
      <thead>
      <tr>

        <template v-for="itemHeader in tableSmallHeader" :key="itemHeader.name">
          <th @click="setSort(itemHeader.name)" v-if="itemHeader.isShow">
            {{ itemHeader.label }}
            <v-icon v-if="sortName === itemHeader.name" icon="mdi-sort"/>
          </th>
        </template>

      </tr>
      </thead>
      <tbody>

      <tr
        v-for="evaluation in evaluations"
        :key="evaluation.id"
      >
        <template v-for="itemHeader in tableSmallHeader" :key="itemHeader.name">
          <td v-if="itemHeader.isShow" class="">
            <router-link class="text-decoration-none  d-flex align-center py-2 h-100 text-primary"
                         :to="{name:'EvaluationDvPage', params:{id:evaluation.id}} ">

                            <span v-if="itemHeader.type==='num'">
                              <template v-if="evaluation[itemHeader.name] || evaluation[itemHeader.name] === 0">
                                {{ evaluation[itemHeader.name].toLocaleString('ru-RU', {'maximumFractionDigits': 2}) }}
                              </template>
                              <template>
                                -
                              </template>

                            </span>
              <span v-else>
                              {{ evaluation[itemHeader.name] }}
                            </span>

            </router-link>
          </td>
        </template>



      </tr>

      </tbody>
    </v-table>
    <v-alert
      v-else
      icon="$info"
      title="Внимание"
      color="primary"
      variant="tonal"
      :elevation="4"
      :text="alertText"
    />
  </div>


</template>

<script>


import {useCoreStore} from "@/apps/core/store";
import {useUserStore} from "@/apps/user/store";

export default {
  name: "EvaluationTable",
  props: ['evaluations', 'sortName', 'sortOrder', 'alertText'],

  setup() {
    const core = useCoreStore()
    const userStore = useUserStore()
    return {
      core,
      userStore,
    }
  },

  data: () => ({
    sortNameLocal: 'id',
    sortOrderLocal: 'up'
  }),

  computed: {
    tableSmallHeader() {
      return [
        {
          label: 'Предмет',
          name: 'subjectLabel',
          type: 'char',
          isShow: true,
        },
        {
          label: 'Группа',
          name: 'groupLabel',
          type: 'char',
          isShow: true,
        },
        {
          label: 'Дата занятия',
          name: 'date',
          type: 'date',
          isShow: true,
        },
      ]
    }
  },

  methods: {
    async setSort(sortName) {
      if (this.sortNameLocal === sortName) {
        if (this.sortOrderLocal === 'up') {
          this.sortOrderLocal = 'down';
        } else {
          this.sortNameLocal = 'id';
          this.sortOrderLocal = 'up';
        }
      } else {
        this.sortNameLocal = sortName;
        this.sortOrderLocal = 'up';
      }
      this.$emit('setSort', {
        sortName: this.sortNameLocal,
        sortOrder: this.sortOrderLocal,
      })
    },
  },

  watch: {
    sortName() {
      this.sortNameLocal = this.sortName;
      this.sortOrderLocal = this.sortOrder;
    }
  }


}
</script>

<style scoped lang="scss">
@import 'src/style';


</style>
