# Stage dans l'équipe Luniqo

TD « Road to MVP » du cours Coordination Front & Back `[RÉEL]` : un développeur
d'un autre groupe rejoint l'équipe (Florent, Thomas, Pauline, Julien) le temps
d'un stage. Il intègre une feature fullstack en respectant les pratiques du
projet : design system, tests, PR relue. Le stage ne commence que si les outils
de pilotage sont prêts.

Ce dossier ne cite pas le stagiaire par son nom (dépôt public) : son
identifiant GitHub apparaît de lui-même sur sa PR.

## La mission

| | |
|---|---|
| US | **LUN-124** « Voir l'état de chaque crèche depuis l'accueil » : une carte par crèche sur l'accueil, avec enfants accueillis, présents et personnel |
| Où la lire | [issue #86](https://github.com/zharrow/Luniqo/issues/86), copie de la story Jira (le stagiaire n'a pas de compte Jira) |
| Parties | API : `GET /api/v2/nurseries/{nursery_id}/summary` ; interface : carte de résumé sur l'accueil |
| Fini quand | la PR est fusionnée dans `develop`, critères d'acceptation et Definition of Done cochés |
| Maître de stage | Florent |
| Relecture | Julien ou Thomas (API), Pauline ou Thomas (interface) |

## Déroulé

| Quand | Quoi | Qui |
|---|---|---|
| Début du stage (2026-11-17) | fork du dépôt, [ONBOARDING.md](../../ONBOARDING.md) étapes 0 à 4 | le stagiaire |
| Début du stage | ticket passé « En cours » dans Jira (sa branche vit dans son fork, l'automatisation ne la voit pas) | Florent |
| Pendant le stage | questions en commentaire de l'issue ; développement, tests, PR vers `develop` | le stagiaire |
| À chaque push sur la PR | lecture du diff, puis *Approve and run* pour lancer la CI ; étiquettes posées à la main | un membre de l'équipe |
| Relecture | commentaires, approbation, fusion | l'équipe |
| Fin du stage (séance du 2026-11-19) | rapport du stagiaire, retour du maître de stage | le stagiaire, Florent |

## Ses droits

Le minimum utile, rien à retirer à la fin (matrice complète dans
[ONBOARDING.md](../../ONBOARDING.md#0-obtenir-les-accès)) :

- GitHub : lecture du dépôt public, PR depuis son fork ; aucune écriture, aucune
  approbation qui compte, aucun accès à `staging`, `main` ni aux tags ;
- la CI d'un fork ne s'exécute qu'après l'accord d'un membre de l'équipe ;
- Jira : aucun compte (sur l'offre gratuite, tout compte administre le projet) ;
- Vercel, Supabase, secrets : aucun accès.

## Rapports de fin de stage

- [RAPPORT-STAGIAIRE.md](RAPPORT-STAGIAIRE.md) : modèle du rapport du stagiaire.
- [RETOUR-MAITRE-DE-STAGE.md](RETOUR-MAITRE-DE-STAGE.md) : modèle du retour du maître de stage.

Chaque blocage relevé devient un ticket Jira pour améliorer l'onboarding ou la
documentation. Les rapports remplis sont versionnés ici, sans nom ni donnée
personnelle, si leurs auteurs l'acceptent.
