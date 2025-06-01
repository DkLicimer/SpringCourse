<template>
  <div id="loader"
       class="container my-auto d-flex flex-row text-primary align-center loader h-100 text-center justify-center bg-dark">
    <div>
      <div class="loader-shape mb-5"></div>
      <div class="text-h5 text-primary mt-5"><p><b>Загрузка...</b></p></div>
    </div>
  </div>
</template>

<script>
export default {
}
</script>

<style scoped lang="scss">
@import '../../../style';

.loader {
  display: flex;
  position: absolute;
  height: 100%;
  background-color: #fff;
  width: 100%;
  z-index: 10000000000;
  flex-flow: column;
  p {
    background: linear-gradient(45deg, #fff 33%, $color-primary 66%, #fff);
    background-size: 300%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: animated_text 2s ease-in-out infinite;
    -moz-animation: animated_text 2s ease-in-out infinite;
    -webkit-animation: animated_text 2s ease-in-out infinite;
  }

  .loader-shape {
    transform: rotateZ(45deg);
    perspective: 1000px;
    border-radius: 50%;
    width: 100px;
    height: 100px;
    color: $color-primary;
    font-size: 40px;
  }

  .loader-shape:before,
  .loader-shape:after {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: inherit;
    height: inherit;
    border-radius: 50%;
    transform: rotateX(70deg);
    animation: 1s spin linear infinite;
  }

  .loader-shape:after {
    color: $color-primary;
    transform: rotateY(70deg);
    animation-delay: .4s;
  }

  @keyframes rotate {
    0% {
      transform: translate(-50%, -50%) rotateZ(0deg);
    }
    100% {
      transform: translate(-50%, -50%) rotateZ(360deg);
    }
  }

  @keyframes rotateccw {
    0% {
      transform: translate(-50%, -50%) rotate(0deg);
    }
    100% {
      transform: translate(-50%, -50%) rotate(-360deg);
    }
  }

  @keyframes spin {
    0%,
    100% {
      box-shadow: .2em 0px 0 0px currentcolor;
    }
    12% {
      box-shadow: .2em .2em 0 0 currentcolor;
    }
    25% {
      box-shadow: 0 .2em 0 0px currentcolor;
    }
    37% {
      box-shadow: -.2em .2em 0 0 currentcolor;
    }
    50% {
      box-shadow: -.2em 0 0 0 currentcolor;
    }
    62% {
      box-shadow: -.2em -.2em 0 0 currentcolor;
    }
    75% {
      box-shadow: 0px -.2em 0 0 currentcolor;
    }
    87% {
      box-shadow: .2em -.2em 0 0 currentcolor;
    }
  }
@keyframes animated_text {
  0% {
    background-position: 66% 33%;
  }
  50% {
    background-position: 0 33%;
  }
  100% {
    background-position: 66% 33%;
  }
}
}
</style>
