var ghpages = require('gh-pages');

ghpages.publish(
    'public', // path to public directory
    {
        branch: 'gh-pages',
        repo: 'https://github.com/ramiroaraujo/musica-luch.git', // Update to point to your repository
        user: {
            name: 'Ramiro Araujo', // update to use your name
            email: 'rama.araujo@gmail.com' // Update to use your email
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)