// --- CONFIGURATION SUPABASE ---
const SUPABASE_URL = 'https://ucjhxdgrdzfmlvuzoocn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjamh4ZGdyZHpmbWx2dXpvb2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2ODAxMTAsImV4cCI6MjEwNTI1NjExMH0.I2TUv1H00mT40q8emMqWHtGifLmMWz0OyXBEYyhw_Cg';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

    alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

document.addEventListener('DOMContentLoaded', () => {
    const connexionForm = document.getElementById('connexionForm');

    if (connexionForm) {
        connexionForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const alertBox = document.getElementById('formAlert');
            if (alertBox) alertBox.style.display = 'none';

            const submitBtn = document.getElementById('submitConnexionBtn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Vérification...';
            }

            let telephoneSaisi = document.getElementById('telephoneConnexion').value.trim();
            const password = document.getElementById('passwordConnexion').value;

            // --- Nettoyage pour ne garder que les 8 derniers chiffres (standard tunisien) ---
            let telephonePropre = telephoneSaisi.replace(/\D/g, ''); 
            if (telephonePropre.length > 8) {
                telephonePropre = telephonePropre.slice(-8); 
            }

            console.log("--- TENTATIVE DE CONNEXION ---");
            console.log("Téléphone brut :", telephoneSaisi);
            console.log("Téléphone nettoyé recherché :", telephonePropre);

            try {
                // 1. Test table Pro
                const resVerifie = await _supabase
                    .from('prestatairesverifie')
                    .select('*');

                // 2. Test table Gratuit
                const resGratuit = await _supabase
                    .from('prestatairesgratuits')
                    .select('*');

                let utilisateurTrouve = null;
                let typeCompte = '';

                const matchPro = resVerifie.data?.find(u => {
                    if (!u.telephone) return false;
                    let telBase = u.telephone.toString().replace(/\D/g, '');
                    if (telBase.length > 8) telBase = telBase.slice(-8);
                    return telBase === telephonePropre && u.password === password;
                });

                const matchGratuit = resGratuit.data?.find(u => {
                    if (!u.telephone) return false;
                    let telBase = u.telephone.toString().replace(/\D/g, '');
                    if (telBase.length > 8) telBase = telBase.slice(-8);
                    return telBase === telephonePropre && u.password === password;
                });

                if (matchPro) {
                    utilisateurTrouve = matchPro;
                    typeCompte = 'Pro';
                } else if (matchGratuit) {
                    utilisateurTrouve = matchGratuit;
                    typeCompte = 'Gratuit';
                }

                if (utilisateurTrouve) {
                    afficherMessage(`🎉 Connexion réussie !<br>Bienvenue, <b>${utilisateurTrouve.nom_entreprise}</b> (${typeCompte}). Redirection...`, 'success');
                    localStorage.setItem('artizpro_user', JSON.stringify(utilisateurTrouve));
                    localStorage.setItem('artizpro_type', typeCompte);

                    // Redirection dynamique selon le type de compte
                    setTimeout(() => {
                        if (typeCompte === 'Pro') {
                            window.location.href = 'clientproconnexion.html';
                        } else {
                            window.location.href = 'clientconnexion.html';
                        }
                    }, 2000);

                } else {
                    afficherMessage('❌ Numéro de téléphone ou mot de passe incorrect.', 'error');
                }

            } catch (error) {
                console.error('Erreur technique :', error);
                afficherMessage('❌ Erreur : ' + error.message, 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Se connecter';
                }
            }
        });
    }
});

// --- FONCTION POUR AFFICHER / MASQUER LE MOT DE PASSE (Page de Connexion) ---
window.togglePasswordVisibility = function() {
    const passwordInput = document.getElementById('passwordConnexion');
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