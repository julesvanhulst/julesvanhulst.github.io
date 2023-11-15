var upButton = document.getElementById('up');

function scrollToTop() {
    if (window.scrollY !== 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

window.onscroll = function() {
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
        upButton.style.display = 'block';
    } else {
        upButton.style.display = 'none';
    }
};