export type Language = 'en' | 'es' | 'fr' | 'de';

export interface Translations {
    common: {
        backToDashboard: string;
        exit: string;
        loading: string;
        connecting: string;
        evaluating: string;
        skip: string;
        level: string;
        totalXp: string;
        rank: string;
        status: string;
        active: string;
        initializeMission: string;
        missionComplete: string;
        rewards: string;
        xpEarned: string;
        rankUnlocked: string;
        missionsUnlocked: string;
        enterCyberQuest: string;
    };
    dashboard: {
        opsCenter: string;
        welcomeBack: string;
        activeDirectives: string;
        recentActivity: string;
        mentorOnline: string;
    };
    mission: {
        brief: string;
        terminalAlice: string;
        objective: string;
        targetInfo: string;
        objectives: string;
        hints: string;
        availableHints: string;
        askAlice: string;
        missionMentor: string;
        terminal: string;
        execute: string;
        enterCommand: string;
    };
    alice: {
        assistant: string;
        helpPlaceholder: string;
        localAi: string;
        cloud: string;
        fallback: string;
        hardwareOptimized: string;
    };
}

export const translations: Record<Language, Translations> = {
    en: {
        common: {
            backToDashboard: "Back to Dashboard",
            exit: "Exit",
            loading: "Loading",
            connecting: "Connecting...",
            evaluating: "Evaluating...",
            skip: "SKIP",
            level: "Level",
            totalXp: "Total XP",
            rank: "Rank",
            status: "Status",
            active: "Active",
            initializeMission: "INITIALIZE MISSION",
            missionComplete: "MISSION COMPLETE",
            rewards: "Rewards",
            xpEarned: "XP Earned",
            rankUnlocked: "Rank Unlocked",
            missionsUnlocked: "Missions Unlocked",
            enterCyberQuest: "ENTER CYBER QUEST"
        },
        dashboard: {
            opsCenter: "Operations Center",
            welcomeBack: "Welcome back, {role}. Your mentor is online.",
            activeDirectives: "Active Directives",
            recentActivity: "Recent Activity",
            mentorOnline: "Mentor Online"
        },
        mission: {
            brief: "Brief",
            terminalAlice: "Terminal + Alice",
            objective: "Mission Objective",
            targetInfo: "TARGET INFO",
            objectives: "MISSION OBJECTIVES",
            hints: "HINTS",
            availableHints: "AVAILABLE HINTS",
            askAlice: "Ask Alice for more hints!",
            missionMentor: "Mission Mentor",
            terminal: "TERMINAL",
            execute: "EXECUTE",
            enterCommand: "Enter command..."
        },
        alice: {
            assistant: "Alice",
            helpPlaceholder: "Ask Alice for help...",
            localAi: "Local AI",
            cloud: "Cloud",
            fallback: "Fallback",
            hardwareOptimized: "Hardware Optimized"
        }
    },
    es: {
        common: {
            backToDashboard: "Volver al Panel",
            exit: "Salir",
            loading: "Cargando",
            connecting: "Conectando...",
            evaluating: "Evaluando...",
            skip: "SALTAR",
            level: "Nivel",
            totalXp: "XP Total",
            rank: "Rango",
            status: "Estado",
            active: "Activo",
            initializeMission: "INICIAR MISIÓN",
            missionComplete: "MISIÓN COMPLETADA",
            rewards: "Recompensas",
            xpEarned: "XP Ganada",
            rankUnlocked: "Rango Desbloqueado",
            missionsUnlocked: "Misiones Desbloqueadas",
            enterCyberQuest: "ENTRAR A CYBER QUEST"
        },
        dashboard: {
            opsCenter: "Centro de Operaciones",
            welcomeBack: "Bienvenido de nuevo, {role}. Tu mentor está en línea.",
            activeDirectives: "Directivas Activas",
            recentActivity: "Actividad Reciente",
            mentorOnline: "Mentor en Línea"
        },
        mission: {
            brief: "Informe",
            terminalAlice: "Terminal + Alice",
            objective: "Objetivo de la Misión",
            targetInfo: "INFORMACIÓN DEL OBJETIVO",
            objectives: "OBJETIVOS DE LA MISIÓN",
            hints: "PISTAS",
            availableHints: "PISTAS DISPONIBLES",
            askAlice: "¡Pide más pistas a Alice!",
            missionMentor: "Mentor de Misión",
            terminal: "TERMINAL",
            execute: "EJECUTAR",
            enterCommand: "Ingrese comando..."
        },
        alice: {
            assistant: "Alice",
            helpPlaceholder: "Pide ayuda a Alice...",
            localAi: "IA Local",
            cloud: "Nube",
            fallback: "Alternativa",
            hardwareOptimized: "Hardware Optimizado"
        }
    },
    fr: {
        common: {
            backToDashboard: "Retour au Tableau de Bord",
            exit: "Quitter",
            loading: "Chargement",
            connecting: "Connexion...",
            evaluating: "Évaluation...",
            skip: "PASSER",
            level: "Niveau",
            totalXp: "XP Totale",
            rank: "Rang",
            status: "Statut",
            active: "Actif",
            initializeMission: "INITIALISER LA MISSION",
            missionComplete: "MISSION TERMINÉE",
            rewards: "Récompenses",
            xpEarned: "XP Gagnée",
            rankUnlocked: "Rang Débloqué",
            missionsUnlocked: "Missions Débloquées",
            enterCyberQuest: "ENTRER DANS CYBER QUEST"
        },
        dashboard: {
            opsCenter: "Centre des Opérations",
            welcomeBack: "Bon retour, {role}. Votre mentor est en ligne.",
            activeDirectives: "Directives Actives",
            recentActivity: "Activité Récente",
            mentorOnline: "Mentor en Ligne"
        },
        mission: {
            brief: "Briefing",
            terminalAlice: "Terminal + Alice",
            objective: "Objectif de la Mission",
            targetInfo: "INFOS CIBLE",
            objectives: "OBJECTIFS DE LA MISSION",
            hints: "INDICES",
            availableHints: "INDICES DISPONIBLES",
            askAlice: "Demandez plus d'indices à Alice !",
            missionMentor: "Mentor de Mission",
            terminal: "TERMINAL",
            execute: "EXÉCUTER",
            enterCommand: "Entrer la commande..."
        },
        alice: {
            assistant: "Alice",
            helpPlaceholder: "Demander de l'aide à Alice...",
            localAi: "IA Locale",
            cloud: "Cloud",
            fallback: "Secours",
            hardwareOptimized: "Optimisé par le Matériel"
        }
    },
    de: {
        common: {
            backToDashboard: "Zurück zum Dashboard",
            exit: "Beenden",
            loading: "Laden",
            connecting: "Verbinden...",
            evaluating: "Bewerten...",
            skip: "ÜBERSPRINGEN",
            level: "Level",
            totalXp: "Gesamt XP",
            rank: "Rang",
            status: "Status",
            active: "Aktiv",
            initializeMission: "MISSION INITIALISIEREN",
            missionComplete: "MISSION ABGESCHLOSSEN",
            rewards: "Belohnungen",
            xpEarned: "Verdiente XP",
            rankUnlocked: "Rang Freigeschaltet",
            missionsUnlocked: "Missionen Freigeschaltet",
            enterCyberQuest: "CYBER QUEST BETRETEN"
        },
        dashboard: {
            opsCenter: "Einsatzzentrum",
            welcomeBack: "Willkommen zurück, {role}. Dein Mentor ist online.",
            activeDirectives: "Aktive Richtlinien",
            recentActivity: "Letzte Aktivität",
            mentorOnline: "Mentor Online"
        },
        mission: {
            brief: "Briefing",
            terminalAlice: "Terminal + Alice",
            objective: "Missionsziel",
            targetInfo: "ZIELINFORMATIONEN",
            objectives: "MISSIONSZIELE",
            hints: "HINWEISE",
            availableHints: "VERFÜGBARE HINWEISE",
            askAlice: "Frage Alice nach weiteren Hinweisen!",
            missionMentor: "Missions-Mentor",
            terminal: "TERMINAL",
            execute: "AUSFÜHREN",
            enterCommand: "Befehl eingeben..."
        },
        alice: {
            assistant: "Alice",
            helpPlaceholder: "Frage Alice um Hilfe...",
            localAi: "Lokale KI",
            cloud: "Cloud",
            fallback: "Fallback",
            hardwareOptimized: "Hardware-optimiert"
        }
    }
};
