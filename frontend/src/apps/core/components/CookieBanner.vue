<template>
  <div v-if="!isCookieAccepted" class="cookie-banner d-md-flex br-20">
    <p>Мы используем cookie для улучшения вашего опыта на нашем сайте. Продолжая использовать сайт, вы соглашаетесь с использованием cookie.</p>
    <button class="br-20 mt-3 mt-md-0" @click="acceptCookies">Принять</button>
  </div>
</template>

<script>
import Cookies from 'js-cookie';

export default {
  data() {
    return {
      isCookieAccepted: false,
    };
  },
  mounted() {
    this.isCookieAccepted = Cookies.get('cookieAccepted') === 'true';
  },
  methods: {
    acceptCookies() {
      Cookies.set('cookieAccepted', 'true', { expires: 365 });
      this.isCookieAccepted = true;
    },
  },
};
</script>

<style scoped lang="scss">
@import "@/style.scss";
.cookie-banner {
  position: fixed;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  padding: 20px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 2px 3px 10px rgba(0, 0, 0, 0.4);
  z-index: 100000000;
  width: 90%;
    @media(min-width: 960px){
    width: 50%;
  }
}

.cookie-banner button {
  @media(min-width: 960px){
  margin-left: 20px;

  }
  padding: 0 30px;
  background-color: $color-primary;
  color: white;
  border: none;
  cursor: pointer;
  height: 40px !important;
}

.cookie-banner button:hover {
  background-color: $color-primary;
}
</style>
