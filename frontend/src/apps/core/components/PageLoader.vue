<template>
  <div >
            <v-progress-linear
              indeterminate
              class="mt-3"
              color="primary"
            />
            <v-skeleton-loader

              class="mx-auto "
              elevation="12"

              type="table-heading, list-item-two-line, image, table-tfoot"
            ></v-skeleton-loader>
          </div>
</template>

<script>
export default {
}
</script>

<style scoped>

</style>
