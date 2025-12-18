        function playPauseVideo() {
            let videos = document.querySelectorAll("video");
            videos.forEach((video) => {
                // We can only control playback without insteraction if video is mute
                video.muted = true;
                // Play is a promise so we need to check we have it
                let playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.then((_) => {
                        let observer = new IntersectionObserver(
                            (entries) => {
                                entries.forEach((entry) => {
                                    if (
                                        entry.intersectionRatio !== 1 &&
                                        !video.paused
                                    ) {
                                        video.pause();
                                    } else if (video.paused) {
                                        video.play();
                                    }
                                });
                            },
                            { threshold: 0.2 }
                        );
                        observer.observe(video);
                    });
                }
            });
        }

        // And you would kick this off where appropriate with:
        playPauseVideo();

        $(document).ready(function () {
            $('.v_slider').slick({
                pauseOnHover: false,
                slidesToShow: 3,
                slidesToScroll: 1,
                arrows: true,
                // autoplay: true,
                // autoplaySpeed:5000,
                loop: true,
                responsive: [
                    {
                        breakpoint: 1199,
                        settings: {
                            slidesToShow: 2,
                        }
                    },
                    {
                        breakpoint: 767,
                        settings: {
                            slidesToShow: 1,
                        }
                    }
                ]
            });

       
        });

        document.addEventListener('DOMContentLoaded', function() {
    const mainImage = document.querySelector('.main-image img');
    const thumbnails = document.querySelectorAll('.thumbnails img');

    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            mainImage.src = this.src;
            mainImage.alt = this.alt;
        });
    });
});

