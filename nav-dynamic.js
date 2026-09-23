document.addEventListener('DOMContentLoaded', () => {
    // 1. Gestion dynamique et fluide du menu mobile
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            if (navMenu.classList.contains('active')) {
                if (icon) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-xmark');
                }
            } else {
                if (icon) {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Animation effet livre de 2 secondes au clic sur un lien du menu avant la redirection
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                // Empêche le changement de page immédiat pour laisser tourner l'animation
                e.preventDefault();
                const targetUrl = link.getAttribute('href');

                // Si le lien n'a pas de cible valide, on ne fait rien
                if (!targetUrl || targetUrl === '#') return;

                navMenu.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-xmark');
                }

                // Déclenche l'effet de pliage de page sur le body entier
                document.body.classList.add('page-turn-active');

                // Attend exactement 2 secondes (2000 ms) pour que l'animation de livre se termine, puis change de page
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 2000);
            });
        });
    }

    // 2. Intelligence de session : Personnalisation automatique de la navbar
    const userDataStr = localStorage.getItem('artizpro_user');
    const typeCompte = localStorage.getItem('artizpro_type');
    
    // Cible le lien de connexion dans la navigation
    const lienConnexion = document.querySelector('a[href="connexion.html"]');

    if (userDataStr && lienConnexion) {
        try {
            let user = JSON.parse(userDataStr);
            
            // Transformation du bouton "Connexion" en badge intelligent "Mon Espace"
            lienConnexion.innerHTML = `<i class="fa-solid fa-user-check"></i> ${user.nom_entreprise || 'Mon Espace'}`;
            lienConnexion.classList.add('user-connected');
            
            // Redirection intelligente selon le type de compte stocké
            if (typeCompte === 'Pro') {
                lienConnexion.setAttribute('href', 'clientproconnexion_2.html');
            } else {
                lienConnexion.setAttribute('href', 'clientconnexion.html');
            }
        } catch (e) {
            console.error("Erreur lors de la lecture des données utilisateur", e);
        }
    }
});