// --- CONFIGURATION SUPABASE ---
const SUPABASE_URL = 'https://ucjhxdgrdzfmlvuzoocn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjamh4ZGdyZHpmbWx2dXpvb2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2ODAxMTAsImV4cCI6MjEwNTI1NjExMH0.I2TUv1H00mT40q8emMqWHtGifLmMWz0OyXBEYyhw_Cg';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let formuleActuelle = 'decouverte';

// Fonction utilitaire pour afficher un message élégant sur la page
function afficherMessage(texte, type = 'success') {
    const alertBox = document.getElementById('formAlert');
    if (!alertBox) return;

    alertBox.innerHTML = texte;
    alertBox.style.display = 'block';

    if (type === 'success') {
        alertBox.style.backgroundColor = '#d1fae5';
        alertBox.style.color = '#065f46';
        alertBox.style.border = '1px solid #a7f3d0';
    } else {
        alertBox.style.backgroundColor = '#fee2e2';
        alertBox.style.color = '#991b1b';
        alertBox.style.border = '1px solid #fecaca';
    }

    // Remonter doucement vers le message pour que l'utilisateur le voie bien
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

document.addEventListener('DOMContentLoaded', async () => {
    // 0. Charger dynamiquement les métiers depuis Supabase dans le select
    const selectSpecialite = document.getElementById('specialite');
    if (selectSpecialite) {
        try {
            const { data: metiers, error } = await _supabase
                .from('metiers')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;

            if (metiers && metiers.length > 0) {
                selectSpecialite.innerHTML = '<option value="">Sélectionnez votre métier</option>';
                metiers.forEach(metier => {
                    const option = document.createElement('option');
                    option.value = metier.nom;
                    option.textContent = metier.nom;
                    selectSpecialite.appendChild(option);
                });
            } else {
                selectSpecialite.innerHTML = '<option value="">Aucun métier trouvé</option>';
            }
        } catch (err) {
            console.error('Erreur lors du chargement des métiers :', err.message);
            selectSpecialite.innerHTML = '<option value="">Erreur de chargement</option>';
        }
    }

    // 1. Gestion du menu mobile
    const menuBtn = document.getElementById('menuBtn');
    const navMenu = document.getElementById('navMenu');

    if (menuBtn && navMenu) {
        menuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = menuBtn.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    }

    // 2. Lecture automatique des paramètres URL
    const urlParams = new URLSearchParams(window.location.search);
    const formule = urlParams.get('formule');
    
    if (formule === 'pro') {
        window.selectionnerFormule('pro');
    } else if (formule === 'decouverte') {
        window.selectionnerFormule('decouverte');
    }

    // 3. Gestion de la soumission du formulaire vers Supabase
    const prestataireForm = document.getElementById('prestataireForm');

    if (prestataireForm) {
        prestataireForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Masquer d'anciens messages
            const alertBox = document.getElementById('formAlert');
            if (alertBox) alertBox.style.display = 'none';

            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enregistrement en cours...';
            }

            // Récupération des valeurs du formulaire
            const nomEntreprise = document.getElementById('nomEntreprise').value;
            const specialite = document.getElementById('specialite').value;
            const ville = document.getElementById('ville').value;
            const telephone = document.getElementById('telephone').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const description = document.getElementById('description').value;

            try {
                if (formuleActuelle === 'decouverte') {
                    const nouveauGratuit = {
                        nom_entreprise: nomEntreprise,
                        specialite: specialite,
                        ville: ville,
                        telephone: telephone,
                        email: email,
                        password: password,
                        description: description
                    };

                    const { error: errGratuit } = await _supabase.from('prestatairesgratuits').insert([nouveauGratuit]);
                    if (errGratuit) throw errGratuit;

                    afficherMessage(`🎉 Inscription réussie ! Bienvenue sur ArtizPro.tn 🇹🇳.<br>Votre profil gratuit a bien été enregistré. Redirection vers votre espace...`, 'success');
                    setTimeout(() => {
                        window.location.href = 'clientconnexion.html';
                    }, 2000);

                } else if (formuleActuelle === 'pro') {
                    const idPayeSaisi = document.getElementById('idPayeInput').value.trim();

                    if (!idPayeSaisi) {
                        throw new Error("Veuillez entrer votre ID Payé.");
                    }

                    // A. Vérifier si l'ID Payé existe dans la table 'ids_paiement'
                    const { data: verifList, error: errVerif } = await _supabase
                        .from('ids_paiement')
                        .select('*')
                        .eq('code_id', idPayeSaisi)
                        .limit(1);

                    if (errVerif) {
                        throw new Error("Erreur lors de la vérification de l'ID : " + errVerif.message);
                    }

                    if (!verifList || verifList.length === 0) {
                        throw new Error("Cet ID Payé est invalide ou n'existe pas dans notre base.");
                    }

                    const verifId = verifList[0];

                    // B. Vérifier si l'ID a déjà été utilisé
                    if (verifId.utilise === true) {
                        throw new Error("Cet ID Payé a déjà été utilisé pour un autre compte. Veuillez nous contacter en cas d'erreur.");
                    }

                    // C. Insérer le prestataire dans la table 'prestatairesverifie' avec la photo par défaut
                    const nouveauVerifie = {
                        nom_entreprise: nomEntreprise,
                        specialite: specialite,
                        ville: ville,
                        telephone: telephone,
                        email: email,
                        password: password,
                        description: description,
                        id_paye: idPayeSaisi,
                        badge_verifie: true,
                        photo_url: 'ArtizPro_Photos/Habib Z/D.jpg' // Valeur par défaut pour les comptes Pro
                    };

                    const { error: errInsert } = await _supabase.from('prestatairesverifie').insert([nouveauVerifie]);
                    if (errInsert) throw errInsert;

                    // D. Marquer l'ID Payé comme utilisé dans 'ids_paiement'
                    const { error: errUpdate } = await _supabase
                        .from('ids_paiement')
                        .update({ utilise: true, utilise_par: email })
                        .eq('code_id', idPayeSaisi);

                    if (errUpdate) {
                        console.error("Avertissement : L'ID n'a pas pu être marqué comme utilisé.", errUpdate.message);
                    }

                    afficherMessage(`⭐ Inscription Pack Pro réussie ! Bienvenue parmi nos partenaires vérifiés sur ArtizPro.tn 🇹🇳.<br>Votre badge est actif. Redirection vers votre espace Pro...`, 'success');
                    setTimeout(() => {
                        window.location.href = 'clientproconnexion.html';
                    }, 2000);
                }

                prestataireForm.reset();
                window.selectionnerFormule('decouverte');

            } catch (error) {
                console.error('Erreur :', error.message);
                afficherMessage('❌ Une erreur est survenue : ' + error.message, 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Soumettre mon inscription';
                }
            }
        });
    }

    // 4. Gestion de la session utilisateur dans la navbar
    const userDataStr = localStorage.getItem('artizpro_user');
    const typeCompte = localStorage.getItem('artizpro_type');
    const lienConnexion = document.querySelector('a[href="connexion.html"], a[href="connexion_5.html"]');

    if (userDataStr && lienConnexion) {
        let user = JSON.parse(userDataStr);
        lienConnexion.innerHTML = `<i class="fa-solid fa-user-check"></i> ${user.nom_entreprise || 'Mon Espace'}`;
        
        if (typeCompte === 'Pro') {
            lienConnexion.setAttribute('href', 'clientproconnexion.html');
        } else {
            lienConnexion.setAttribute('href', 'clientconnexion.html');
        }
        
        lienConnexion.style.color = 'var(--primary)';
        lienConnexion.style.fontWeight = 'bold';
    }
});

// --- FONCTION GLOBALE DE SÉLECTION DES FORMULES ---
window.selectionnerFormule = function(type) {
    formuleActuelle = type;
    const cardDecouverte = document.getElementById('cardDecouverte');
    const cardPro = document.getElementById('cardPro');
    const idPayeGroup = document.getElementById('idPayeGroup');
    const idPayeInput = document.getElementById('idPayeInput');

    if (type === 'decouverte') {
        if (cardDecouverte) cardDecouverte.classList.add('active');
        if (cardPro) cardPro.classList.remove('active');
        if (idPayeGroup) idPayeGroup.style.display = 'none';
        if (idPayeInput) idPayeInput.removeAttribute('required');
    } else if (type === 'pro') {
        if (cardPro) cardPro.classList.add('active');
        if (cardDecouverte) cardDecouverte.classList.remove('active');
        if (idPayeGroup) idPayeGroup.style.display = 'block';
        if (idPayeInput) idPayeInput.setAttribute('required', 'true');
    }
};

// --- FONCTION POUR AFFICHER / MASQUER LE MOT DE PASSE ---
window.togglePasswordVisibility = function() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('togglePasswordIcon');
    
    if (passwordInput && toggleIcon) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    }
};