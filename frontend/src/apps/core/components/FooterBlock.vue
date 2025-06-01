<template>
  <footer class=" ">
    <div class="d-flex">
      <a href="https://glad-dev.ru" target="_blank" class="text-black text-decoration-none">

        <div class="bg-white wrap-logo pt-1 pb-0 px-3 d-flex elevation-3">
          <div class="me-2 "><img class="logo-footer" src="@/assets/5.png" alt=""></div>

  <!--          <div>-->
  <!--            <div>Разработка</div>-->
  <!--            <div><b>Gladkikh Develop</b></div>-->
  <!--          </div>-->
        </div>

      </a>
    </div>
  </footer>
</template>

<script>
export default {}
</script>

<style scoped lang="scss">

.logo-footer {
  height: 30px;
}

footer {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 100;
  //border-top: 1px solid #ddd;
  color: #000 !important;
}

footer a, footer div {
  font-size: 7pt !important;
}

.wrap-logo {
  border-radius: 0 20px 0 0;
}
</style>
