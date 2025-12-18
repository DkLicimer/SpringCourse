$(document).ready(function () {
            $('.v_slider').slick({
                slidesToShow: 1,
                slidesToScroll: 1,
                autoplay: true,
                autoplaySpeed: 2000, // Adjust as needed
                dots: true,
                prevArrow: false,
                nextArrow: false,
                infinite: true,
                speed: 500,
                fade: true,
                cssEase: 'linear'
            });

            // Play/pause videos on slide change
            $('.v_slider').on('beforeChange', function (event, slick, currentSlide, nextSlide) {
                // Pause all videos
                $('.s_video').each(function () {
                    this.pause();
                });
            });
        });

        function toggleVideo(slideIndex) {
            var svideo = $('.v_slider').find('.slick-slide').eq(slideIndex).find('.s_video')[0];
            var button = $('.v_slider').find('.slick-slide').eq(slideIndex).find('.custom-button')[0];

            if (svideo.paused) {
                svideo.play();
                button.classList.add('playing');
            } else {
                svideo.pause();
                button.classList.remove('playing');
            }
        }