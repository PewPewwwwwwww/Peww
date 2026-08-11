const themeSwitch = document.getElementById('theme-switch');

    if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('darkmode');
    }

    themeSwitch.addEventListener('click', () => {
        document.body.classList.toggle('darkmode');
        localStorage.setItem('theme', document.body.classList.contains('darkmode') ? 'dark' : 'light'
    );
});

