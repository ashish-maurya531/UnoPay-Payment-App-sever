// ====== pre-loader ======
document.addEventListener("DOMContentLoaded", function () {
  var preloader = document.createElement("div");
  preloader.className = "preloader";

  var logo = document.createElement("div");
  logo.className = "preloader-logo";

  preloader.appendChild(logo);
  document.body.appendChild(preloader);

  var cursorEffect = document.createElement("div");
  cursorEffect.className = "cursor-effect";
  cursorEffect.style.position = "fixed";
  cursorEffect.style.zIndex = "9999";
  cursorEffect.style.transition =
    "transform 0.2s ease, left 0.1s ease, top 0.1s ease";
  document.body.appendChild(cursorEffect);

  document.addEventListener("mousemove", function (e) {
    var cursorSize = 30;
    var x = Math.max(0, Math.min(e.clientX, window.innerWidth - cursorSize));
    var y = Math.max(0, Math.min(e.clientY, window.innerHeight - cursorSize));

    cursorEffect.style.left = x + "px";
    cursorEffect.style.top = y + "px";
  });

  function removePreloader() {
    setTimeout(function () {
      preloader.style.opacity = "0";
      setTimeout(function () {
        preloader.style.display = "none";
        preloader.remove();
        document.body.classList.remove("preloader-active");
        var siteWrapper = document.querySelector(".site-wrapper");
        siteWrapper.style.visibility = "visible";
        siteWrapper.style.overflow = "auto";
        siteWrapper.style.display = "block";
        siteWrapper.style.opacity = "1";
        siteWrapper.style.transition = "opacity 0.5s ease";
        setTimeout(() => {
          siteWrapper.style.opacity = "1";
        }, 10);
        AOS.init({
          once: true,
          duration: 1500,
        });

        // ====== Back to top ======
        if (document.querySelector(".scrollToTop")) {
          var box = document.querySelector(".scrollToTop");
          var water = document.querySelector(".scrollToTop .water");

          function updateDimensions() {
            windowHeight = window.innerHeight;
            documentHeight =
              document.documentElement.scrollHeight - windowHeight;
          }

          updateDimensions();

          window.addEventListener("resize", updateDimensions);

          window.addEventListener("scroll", function () {
            var scrollPosition = window.scrollY;
            var percent = Math.min(
              Math.floor((scrollPosition / documentHeight) * 100),
              100
            );
            water.style.transform = "translate(0," + (100 - percent) + "%)";

            if (scrollPosition >= 200) {
              box.style.display = "block";
            } else {
              box.style.display = "none";
            }
          });

          if (box !== null) {
            box.addEventListener("click", function () {
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            });
          }
        }
      }, 500);
    }, 500);
  }

  document.body.classList.add("preloader-active");
  window.addEventListener("load", function () {
    removePreloader();
  });

  // ====== Custom_Cursor Effect  ======
  document.querySelectorAll("a, button").forEach(function (element) {
    element.addEventListener("mouseenter", function () {
      cursorEffect.style.transform = "scale(1.5) translate(-30px, -30px)";
    });
    element.addEventListener("mouseleave", function () {
      cursorEffect.style.transform = "scale(1) translate(-30px, -30px)";
    });
  });
});

// ====== 1.1 header (aside navigation bar) ======
if (document.getElementById("mySidenav")) {
  function open_aside() {
    "use strict";
    const sidepanel = document.getElementById("mySidenav");
    if (sidepanel) {
      sidepanel.style.left = "0";
    } else {
      console.error("Error: Side panel element not found!");
    }
  }
  function close_aside() {
    "use strict";
    const sidepanel = document.getElementById("mySidenav");
    if (sidepanel) {
      sidepanel.style.left = "-355px";
    } else {
      console.error("Error: Side panel element not found!");
    }
  }
  // aside page button
  let slid = document.getElementById("slid-btn");
  if (slid !== null) {
    slid.onclick = () => {
      let dropdwon = document.getElementById("slid-drop");
      dropdwon.classList.toggle("aside-dropdwon");
    };
  }
}

// Search icone js in next pages
if (document.querySelector(".searchModal")) {
  function openSearchModal() {
    const modal = document.querySelector(".searchModal");
    modal.style.display = "flex";
    document.body.classList.add("modal-open");
    setTimeout(() => {
      modal.classList.add("show");
    }, 10);
  }
  function closeSearchModal() {
    const modal = document.querySelector(".searchModal");
    modal.classList.remove("show");
    setTimeout(() => {
      modal.style.display = "none";
      document.body.classList.remove("modal-open");
    }, 500);
  }
  document
    .querySelector(".SearchModal a")
    .addEventListener("click", openSearchModal);
}

// ====== 1.1 header (dropdown bar) ======
const dropdowns = document.querySelectorAll(".navbar .dropdown");
dropdowns.forEach((dropdown) => {
  const dropdownMenu = dropdown.querySelector(".dropdown-menu");
  dropdownMenu.style.maxHeight = "0";
  dropdown.addEventListener("mouseenter", () => {
    dropdownMenu.style.visibility = "visible";
    dropdownMenu.style.maxHeight = `${dropdownMenu.scrollHeight}px`;
  });
  dropdown.addEventListener("mouseleave", () => {
    dropdownMenu.style.visibility = "hidden";
    dropdownMenu.style.maxHeight = "0";
  });
});

// ======== 1.3. Partners section =======
if (document.querySelector(".PartnersSlider")) {
  $(".PartnersSlider").slick({
    arrows: false,
    dots: false,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 2000,
    speed: 3000,
    slidesToShow: 6,
    cssEase: "linear",
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 5,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 900,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 700,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 400,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
    ],
  });
}

//  1.14. footer section === Submit message
const contactForm = document.querySelector("footer form");
if (contactForm !== null)
  contactForm.addEventListener("submit", function (event) {
    const path = document
      .querySelector("footer .modal img")
      .getAttribute("src");
    document.querySelector("footer .modal img").setAttribute("src", "");
    event.preventDefault();
    var modal = new bootstrap.Modal(document.querySelector("footer .modal"));
    modal.show();
    document.querySelector("footer form").reset();
    document.querySelector("footer .modal img").setAttribute("src", path);
    setTimeout(() => {
      modal.hide();
    }, 5000);
  });

// ======= 1.15. Footer Date ========
if (document.getElementById("year")) {
  document.addEventListener("DOMContentLoaded", function () {
    let currentYear = new Date().getFullYear();

    let yearElement = document.getElementById("year");
    yearElement.innerText = currentYear;
  });
}

//  8.3. Comment section === Submit message
const contactForm3 = document.querySelector(".Comment form");
if (contactForm3 !== null)
  contactForm3.addEventListener("submit", function (event) {
    const path = document
      .querySelector(".Comment .modal img")
      .getAttribute("src");
    document.querySelector(".Comment .modal img").setAttribute("src", "");
    event.preventDefault();
    var modal = new bootstrap.Modal(document.querySelector(".Comment .modal"));
    modal.show();
    document.querySelector(".Comment form").reset();
    document.querySelector(".Comment .modal img").setAttribute("src", path);
    setTimeout(() => {
      modal.hide();
    }, 5000);
  });

//  9.2. Contact section === Submit message
const contactForm1 = document.querySelector(".Contact form");
if (contactForm1 !== null)
  contactForm1.addEventListener("submit", function (event) {
    const path = document
      .querySelector(".Contact .modal img")
      .getAttribute("src");
    document.querySelector(".Contact .modal img").setAttribute("src", "");
    event.preventDefault();
    var modal = new bootstrap.Modal(document.querySelector(".Contact .modal"));
    modal.show();
    document.querySelector(".Contact form").reset();
    document.querySelector(".Contact .modal img").setAttribute("src", path);
    setTimeout(() => {
      modal.hide();
    }, 5000);
  });

// ========== Numbers Animations for spans =======
function animateNumbers(num, finalValue, duration, isDecimal) {
  let start = null;
  const finalValueStr = num.getAttribute("data-final-value");
  const charCount = finalValueStr.length;
  num.style.display = "inline-block";
  num.style.width = `${charCount}ch`;
  const numberFormatter = new Intl.NumberFormat(
    "en-US",
    isDecimal ? { minimumFractionDigits: 1, maximumFractionDigits: 1 } : {}
  );
  function step(timestamp) {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const currentValue = progress * finalValue;
    num.textContent = numberFormatter.format(
      isDecimal ? currentValue.toFixed(1) : Math.floor(currentValue)
    );
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      num.style.display = "inline";
    }
  }
  window.requestAnimationFrame(step);
}
function startNumberAnimation() {
  const numbers = document.querySelectorAll(".number");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const finalValueStr = entry.target.getAttribute("data-final-value");
          const isDecimal = finalValueStr.includes(".");
          const finalValue = isDecimal
            ? parseFloat(finalValueStr)
            : parseInt(finalValueStr, 10);
          animateNumbers(entry.target, finalValue, 2000, isDecimal);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  numbers.forEach((num) => observer.observe(num));
}
startNumberAnimation();
window.addEventListener("load", startNumberAnimation);
