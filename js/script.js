(function($) {
	
	"use strict";

	$(".menu-btn").on("click", function() {
		$("body").toggleClass("active");
		$(this).toggleClass("active");
		return false;
	});

	$(".share-btn").on("click", function() {
		$(".banner-social").toggleClass("active");
		return false;
	});

	$(".variations li, .pro-colors li").on("click", function() {
		$(this).addClass("active").siblings().removeClass("active");
	});



    $(".menu-links ul").parent().addClass("menu-item-has-children");
    $(".menu-links li.menu-item-has-children > a").on("click", function() {
      $(this).parent().toggleClass("active").siblings().removeClass("active");
      $(this).next("ul").slideToggle();
      $(this).parent().siblings().find("ul").slideUp();
      return false;
    });

	// STICKY HEADER 

	var banner_height = $(".main-slider").innerHeight();

    $(window).on("scroll", function () {
        if ($(this).scrollTop() > banner_height) {
            $("header").addClass("sticky animated slideInDown");
        } else {
            $("header").removeClass("sticky animated slideInDown");
        }
    });
	
	//Hide Loading Box (Preloader)
	function handlePreloader() {
		if($('.loading').length){
			$('.loading').delay(200).fadeOut(500);
		}
	}

	$('.minus-btn').on('click', function(e) {
		e.preventDefault();
		var $this = $(this);
		var $input = $this.closest('div').find('input');
		var value = parseInt($input.val());

		if (value > 1) {
			value = value - 1;
		} else {
			value = 0;
		}

    $input.val(value);

	});

	$('.plus-btn').on('click', function(e) {
		e.preventDefault();
		var $this = $(this);
		var $input = $this.closest('div').find('input');
		var value = parseInt($input.val());

		if (value < 100) {
  		value = value + 1;
		} else {
			value =100;
		}

		$input.val(value);
	});


	
/* ==========================================================================
   When document is loading, do
   ========================================================================== */
	
	$(window).on('load', function() {
		handlePreloader();
	});	



	$(".search-btn").on("click", function() {
		$(".search-box").toggleClass("active");
	});
	$(".close-search, html").on("click", function() {
		$(".search-box").removeClass("active");
	});

	$(".search-box, header").on("click", function(e) {
		e.stopPropagation();
	});

	$(".cart-btn").on("click", function() {
		$(".cart-sidebar").addClass("active");
		$(".page-wrapper").addClass("page-overlay");
	});

	$(".cls-btn, html").on("click", function() {
		$(".cart-sidebar").removeClass("active");
		$(".page-wrapper").removeClass("page-overlay");
	});

	$("header, .cart-sidebar").on("click", function(e) {
		e.stopPropagation();
	});


	$(".subscribe-popup .close-popup").on("click", function() {
		$(".subscribe-popup").addClass("remove");
		$(".page-wrapper").addClass("overlay-remove");
		return false;
	});

	$(".coming-soon-popup .close-popup").on("click", function() {
		$(".coming-soon-popup").addClass("remove");
		$(".page-wrapper").addClass("overlay-remove");
		return false;
	});


	$(".size-popup-show").on("click", function() {
		$(".size-popup").addClass("active");
		$(".page-wrapper").addClass("overlay");
		return false;
	});

	$(".size-popup .close-popup").on("click", function() {
		$(".size-popup").removeClass("active");
		$(".page-wrapper").removeClass("overlay");
		return false;
	});


	$(".coming-soon-popup .close-popup").on("click", function() {
		$(".coming-soon-popup").addClass("remove-popup");
		return false;
	});


	$(".quick-view-btn").on("click", function() {
		$(".shop-single-section.popup-quick-view").addClass("active");
		$(".page-wrapper").addClass("overlay");
		$(".page-wrapper").removeClass("overlay-remove");
		return false;
	});

	$(".popup-quick-view .close-popup").on("click", function() {
		$(".shop-single-section.popup-quick-view").removeClass("active");
		$(".page-wrapper").removeClass("overlay");
		$(".page-wrapper").addClass("overlay-remove");
		return false;
	});


	//  ============= SIGNIN CONTROL FUNCTION =========

    $('.tabs-icons li').on("click", function(){
		var tab_id = $(this).attr('data-tab');
		$('.tabs-icons li').removeClass('current');
		$('.custom-tab-pane').removeClass('current');
		$(this).addClass('current animated fadeIn');
		$("#"+tab_id).addClass('current animated fadeIn');
		return false;
	});

	/*==============================================
                      Custom Dropdown
    ===============================================*/

    $('.drop-menu').on('click', function () {
        $(this).attr('tabindex', 1).focus();
        $(this).toggleClass('active');
        $(this).find('.dropeddown').slideToggle(300);
    });
    $('.drop-menu').on("focusout", function () {
        $(this).removeAttr('tabindex', 1).focus();
        $(this).removeClass('active');
        $(this).find('.dropeddown').slideUp(300);
    });
    $('.drop-menu .dropeddown li').on('click', function () {
        $(this).parents('.drop-menu').find('span').text($(this).text());
        $(this).parents('.drop-menu').find('span').addClass("selected");
        $(this).parents('.drop-menu').find('input').attr('value', $(this).attr('id'));
    });




})(window.jQuery);



$(window).on("load", function(){
	setInterval(function(){ 
	  $('.subscribe-popup, .coming-soon-popup').addClass("active");
	  $(".page-wrapper.home1").addClass("overlay");
	}, 2000);
  
  });

  	/*=====================$$$=========================
                     sahil Js Start
    ========================$$$=======================*/
	var   top_furniture = document.getElementsByClassName("top-furniture-swiper-container");
if (top_furniture.length > 0) {

	var swiper_i4 = new Swiper('.top-furniture-swiper-container', {
		pagination: {
			el: ".swiper-pagination",
			clickable: true,
			dynamicBullets:true,
		  },
		  autoplay: 
		  {
			delay: 2000,
		  },
		slidesPerView: 3 ,
		centeredSlides: true,
		paginationClickable: true,
		loop: true,
		spaceBetween: 30,
		slideToClickedSlide: true,
		breakpoints: {
 
			768: {
				slidesPerView: 3
			},
 
			320: {
				slidesPerView: 1
			}
		}
	  });
}
var  i4_testi = document.getElementsByClassName("i4_testimonial_container");
if (i4_testi.length > 0) {

	var swiper_i4 = new Swiper('.i4_testimonial_container', {
		pagination: {
			el: ".swiper-pagination",
			clickable: true,
		  },
		  autoplay: 
		  {
			delay: 2000,
		  },
		slidesPerView: 2 ,
		centeredSlides: true,
		paginationClickable: true,
		loop: true,
		spaceBetween: 30,
		slideToClickedSlide: true,
		breakpoints: {
 
			768: {
				slidesPerView: 2
			},
 
			320: {
				slidesPerView: 1
			}
		}
	  });
}

$('.acc-slideri5').slick({
	slidesToShow: 4,
	slidesToScroll: 1,
	focusOnSelect: true,
	arrows:true,
	dots:false,
	autoplay:true,
	responsive: [{
			breakpoint: 1199,
			settings: {
				vertical: false,
				slidesToShow: 3
			}
		},
		{
			breakpoint: 991,
			settings: {
				vertical: false,
				slidesToShow:2
			}
		},
		{
			breakpoint: 576,
			settings: {
				vertical: false,
				slidesToShow: 1
			}
		},
		{
			breakpoint: 480,
			settings: {
				vertical: false,
				slidesToShow: 1
			}
		}
	]
});

// ============vertical slider=============
$('.verticalslider').slick({

	slidesToScroll: 1,
	arrows: false,
	dots: true,
	vertical: true,
	speed: 1000,
	loop:true,
	verticalSwiping: true 
	})
		

    // =============scroll===================== 
    const header = document.getElementById("header")
window.addEventListener("scroll", () => {
  if (window.pageYOffset > $("header").innerHeight()) {
    $("header").addClass("sticky_header");
  } else {
    $("header").removeClass("sticky_header");
  }
}) 

// =======toggle=============
$(document).ready(function () {
    $("header .toggle").click(function () {
      $(this).toggleClass('toggle_active');
      $("header nav").toggleClass('active_nav');
      $("body").toggleClass('active_body');
    });
    $("header nav ul li a").click(function () {
      $("header nav").removeClass('active_nav');
      $("header .toggle").removeClass('toggle_active');
      $("body").removeClass('active_body');
  
    });


});

