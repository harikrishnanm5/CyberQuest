import { Mission, SkillCategory, SkillMetric } from '../types';
import { Language } from './translations';

// Story Arc: "The Shadow Network"
// A progressive narrative where students investigate a mysterious cyber threat

export interface StoryMission extends Mission {
  storyChapter: number;
  objectives: string[];
  hints: string[];
  terminalCommands: string[];
  expectedOutcome: string;
}

// Story chapters based on skill categories
// Story chapters based on skill categories
const STORY_ARC: Record<Language, { title: string; description: string; chapters: any[] }> = {
  en: {
    title: "Operation: Shadow Network",
    description: "A mysterious hacker group called 'The Shadows' has been targeting critical infrastructure. Your mission is to track them down, analyze their methods, and stop their attacks before it's too late.",
    chapters: [
      {
        chapter: 1,
        title: "The Breach",
        skill: "Network_Ops" as SkillCategory,
        narrative: "A government server has been compromised. Initial reports suggest unauthorized network access. You need to investigate the network traffic and identify how the attackers got in.",
      },
      {
        chapter: 2,
        title: "Web of Lies",
        skill: "Web_Security" as SkillCategory,
        narrative: "The attackers left a backdoor in a web application. You must find and analyze the vulnerability they exploited to gain persistent access.",
      },
      {
        chapter: 3,
        title: "Encrypted Secrets",
        skill: "Cryptography" as SkillCategory,
        narrative: "Recovered files are encrypted with an unknown cipher. Decrypt them to reveal the attackers' next target and their communication channels.",
      },
      {
        chapter: 4,
        title: "Digital Footprints",
        skill: "Linux_Forensics" as SkillCategory,
        narrative: "A compromised Linux server contains crucial evidence. Perform forensic analysis to recover deleted files and trace the attacker's activities.",
      },
      {
        chapter: 5,
        title: "Cloud Infiltration",
        skill: "Cloud_Defense" as SkillCategory,
        narrative: "The Shadows have moved their operations to the cloud. Identify misconfigured cloud resources and track their command & control infrastructure.",
      },
      {
        chapter: 6,
        title: "The Final Strike",
        skill: "Threat_Intel" as SkillCategory,
        narrative: "With all intelligence gathered, it's time to predict and prevent their final attack. Analyze patterns and stop The Shadows before they strike critical infrastructure.",
      }
    ]
  },
  es: {
    title: "Operación: Red en la Sombra",
    description: "Un misterioso grupo de hackers llamado 'Las Sombras' ha estado atacando infraestructura crítica. Tu misión es rastrearlos, analizar sus métodos y detener sus ataques antes de que sea demasiado tarde.",
    chapters: [
      {
        chapter: 1,
        title: "La Brecha",
        skill: "Network_Ops",
        narrative: "Un servidor gubernamental ha sido comprometido. Los informes iniciales sugieren acceso a la red no autorizado. Debes investigar el tráfico de red e identificar cómo entraron los atacantes.",
      },
      {
        chapter: 2,
        title: "Red de Mentiras",
        skill: "Web_Security",
        narrative: "Los atacantes dejaron una puerta trasera en una aplicación web. Debes encontrar y analizar la vulnerabilidad que explotaron para obtener acceso persistente.",
      },
      {
        chapter: 3,
        title: "Secretos Encriptados",
        skill: "Cryptography",
        narrative: "Los archivos recuperados están encriptados con un cifrado desconocido. Descríptalos para revelar el próximo objetivo de los atacantes y sus canales de comunicación.",
      },
      {
        chapter: 4,
        title: "Huellas Digitales",
        skill: "Linux_Forensics",
        narrative: "Un servidor Linux comprometido contiene pruebas cruciales. Realiza un análisis forense para recuperar archivos eliminados y rastrear las actividades del atacante.",
      },
      {
        chapter: 5,
        title: "Infiltración en la Nube",
        skill: "Cloud_Defense",
        narrative: "Las Sombras han movido sus operaciones a la nube. Identifica recursos en la nube mal configurados y rastrea su infraestructura de comando y control.",
      },
      {
        chapter: 6,
        title: "El Golpe Final",
        skill: "Threat_Intel",
        narrative: "Con toda la inteligencia recopilada, es hora de predecir y prevenir su ataque final. Analiza patrones y detén a Las Sombras antes de que ataquen la infraestructura crítica.",
      }
    ]
  },
  fr: {
    title: "Opération : Réseau de l'Ombre",
    description: "Un mystérieux groupe de hackers appelé 'Les Ombres' a ciblé des infrastructures critiques. Votre mission est de les traquer, d'analyser leurs méthodes et d'arrêter leurs attaques avant qu'il ne soit trop tard.",
    chapters: [
      {
        chapter: 1,
        title: "La Brèche",
        skill: "Network_Ops",
        narrative: "Un serveur gouvernemental a été compromis. Les premiers rapports suggèrent un accès réseau non autorisé. Vous devez enquêter sur le trafic réseau et identifier comment les attaquants sont entrés.",
      },
      {
        chapter: 2,
        title: "Réseau de Mensonges",
        skill: "Web_Security",
        narrative: "Les attaquants ont laissé une porte dérobée dans une application web. Vous devez trouver et analyser la vulnérabilité qu'ils ont exploitée pour obtenir un accès persistant.",
      },
      {
        chapter: 3,
        title: "Secrets Cryptés",
        skill: "Cryptography",
        narrative: "Les fichiers récupérés sont cryptés avec un code inconnu. Décryptez-les pour révéler la prochaine cible des attaquants et leurs canaux de communication.",
      },
      {
        chapter: 4,
        title: "Empreintes Numériques",
        skill: "Linux_Forensics",
        narrative: "Un serveur Linux compromis contient des preuves cruciales. Effectuez une analyse médico-légale pour récupérer les fichiers supprimés et retracer les activités de l'attaquant.",
      },
      {
        chapter: 5,
        title: "Infiltration Cloud",
        skill: "Cloud_Defense",
        narrative: "Les Ombres ont déplacé leurs opérations vers le cloud. Identifiez les ressources cloud mal configurées et traquez leur infrastructure de commande et de contrôle.",
      },
      {
        chapter: 6,
        title: "L'Attaque Finale",
        skill: "Threat_Intel",
        narrative: "Avec tous les renseignements recueillis, il est temps de prédire et de prévenir leur attaque finale. Analysez les modèles et arrêtez Les Ombres avant qu'elles ne frappent des infrastructures critiques.",
      }
    ]
  },
  de: {
    title: "Operation: Schatten-Netzwerk",
    description: "Eine mysteriöse Hackergruppe namens 'Die Schatten' hat es auf kritische Infrastrukturen abgesehen. Deine Mission ist es, sie aufzuspüren, ihre Methoden zu analysieren und ihre Angriffe zu stoppen, bevor es zu spät ist.",
    chapters: [
      {
        chapter: 1,
        title: "Der Einbruch",
        skill: "Network_Ops",
        narrative: "Ein Regierungsserver wurde kompromittiert. Erste Berichte deuten auf unbefugten Netzwerkzugriff hin. Du musst den Netzwerkverkehr untersuchen und herausfinden, wie die Angreifer eingedrungen sind.",
      },
      {
        chapter: 2,
        title: "Netz der Lügen",
        skill: "Web_Security",
        narrative: "Die Angreifer haben eine Hintertür in einer Webanwendung hinterlassen. Du musst die Sicherheitslücke finden und analysieren, die sie ausgenutzt haben, um dauerhaften Zugriff zu erhalten.",
      },
      {
        chapter: 3,
        title: "Verschlüsselte Geheimnisse",
        skill: "Cryptography",
        narrative: "Wiederhergestellte Dateien sind mit einer unbekannten Chiffre verschlüsselt. Entschlüssele sie, um das nächste Ziel der Angreifer und ihre Kommunikationskanäle zu enthüllen.",
      },
      {
        chapter: 4,
        title: "Digitale Fußabdrücke",
        skill: "Linux_Forensics",
        narrative: "Ein kompromittierter Linux-Server enthält wichtige Beweise. Führe eine forensische Analyse durch, um gelöschte Dateien wiederherzustellen und die Aktivitäten des Angreifers zurückzuverfolgen.",
      },
      {
        chapter: 5,
        title: "Cloud-Infiltration",
        skill: "Cloud_Defense",
        narrative: "Die Schatten haben ihre Operationen in die Cloud verlegt. Identifiziere fehlkonfigurierte Cloud-Ressourcen und verfolge ihre Command-and-Control-Infrastruktur.",
      },
      {
        chapter: 6,
        title: "Der finale Schlag",
        skill: "Threat_Intel",
        narrative: "Nachdem alle Informationen gesammelt wurden, ist es an der Zeit, ihren finalen Angriff vorherzusagen und zu verhindern. Analysiere Muster und stoppe Die Schatten, bevor sie kritische Infrastruktur angreifen.",
      }
    ]
  }
};

// Mission templates for each skill category
const MISSION_TEMPLATES: Record<SkillCategory, {
  title: string;
  description: string;
  objectives: string[];
  hints: string[];
  terminalCommands: string[];
  expectedOutcome: string;
}> = {
  Network_Ops: {
    title: "Network Reconnaissance: The Entry Point",
    description: "Analyze network traffic logs to identify the attack vector. The breach occurred through a vulnerable network service. Find the open ports, identify the service versions, and determine how the attackers gained initial access.",
    objectives: [
      "Scan the target network to discover live hosts",
      "Identify open ports and running services",
      "Analyze network traffic for suspicious patterns",
      "Determine the initial attack vector",
      "Document findings for the incident report"
    ],
    hints: [
      "Start with a ping sweep to find live hosts",
      "Use nmap with service detection (-sV) for detailed info",
      "Look for unusual port combinations or outdated services",
      "Check for common vulnerable ports: 21, 22, 23, 80, 443, 3306, 3389"
    ],
    terminalCommands: [
      "ping", "nmap", "netstat", "tcpdump", "traceroute", "whois", "nslookup"
    ],
    expectedOutcome: "Identify the vulnerable service (likely an outdated SSH or FTP server) that allowed initial access"
  },

  Web_Security: {
    title: "Web Application Analysis: The Backdoor",
    description: "A web application on the compromised server contains a hidden backdoor. Perform security testing to find SQL injection, XSS, or other vulnerabilities that the attackers are using for persistent access.",
    objectives: [
      "Map the web application structure",
      "Test for SQL injection vulnerabilities",
      "Check for Cross-Site Scripting (XSS) flaws",
      "Identify any uploaded backdoors or webshells",
      "Document the exploitation path"
    ],
    hints: [
      "Check login forms and search boxes for SQL injection",
      "Look for reflected input that might indicate XSS",
      "Common backdoor locations: /uploads/, /images/, /temp/",
      "Use Burp Suite or manual testing with special characters"
    ],
    terminalCommands: [
      "curl", "wget", "sqlmap", "nikto", "gobuster", "dirb"
    ],
    expectedOutcome: "Find the webshell or backdoor uploaded by attackers (e.g., cmd.php, shell.jsp)"
  },

  Cryptography: {
    title: "Cryptanalysis: Breaking the Code",
    description: "Intercepted communications between The Shadows are encrypted. The encryption appears to be a combination of classical and modern ciphers. Decrypt the messages to reveal their next target.",
    objectives: [
      "Identify the cipher type used in the encrypted files",
      "Decrypt the intercepted messages",
      "Analyze the decrypted content for intelligence",
      "Extract the attackers' next target location",
      "Report findings to command"
    ],
    hints: [
      "Check for common cipher patterns: Caesar, Vigenère, Base64",
      "Frequency analysis helps with substitution ciphers",
      "Look for headers or markers indicating encryption type",
      "Modern ciphers might use AES or RSA - check for keys"
    ],
    terminalCommands: [
      "openssl", "base64", "xxd", "hexdump", "hashcat", "john"
    ],
    expectedOutcome: "Decrypt messages revealing the next target and attack timeline"
  },

  Linux_Forensics: {
    title: "Digital Forensics: Evidence Recovery",
    description: "The compromised Linux server holds crucial evidence. Attackers attempted to cover their tracks by deleting logs and files. Use forensic techniques to recover deleted data and reconstruct the attack timeline.",
    objectives: [
      "Create a forensic image of the compromised system",
      "Analyze system logs for intrusion indicators",
      "Recover deleted files and browser history",
      "Examine user accounts for unauthorized access",
      "Reconstruct the attack timeline"
    ],
    hints: [
      "Check /var/log/ for authentication and system logs",
      "Use tools like foremost or photorec for file recovery",
      "Examine .bash_history for command traces",
      "Look at /tmp and /var/tmp for temporary attack files"
    ],
    terminalCommands: [
      "dd", "strings", "grep", "awk", "sed", "find", "ls", "cat", "file"
    ],
    expectedOutcome: "Recover deleted attack scripts and establish a complete timeline of the compromise"
  },

  Cloud_Defense: {
    title: "Cloud Security: Exposed Infrastructure",
    description: "The Shadows have migrated their C&C servers to cloud infrastructure. Analyze cloud configurations to find misconfigured S3 buckets, exposed databases, and vulnerable serverless functions that reveal their operations.",
    objectives: [
      "Identify exposed cloud storage buckets",
      "Check for publicly accessible databases",
      "Analyze IAM permissions and access controls",
      "Map the cloud infrastructure architecture",
      "Find evidence of attacker activities in cloud logs"
    ],
    hints: [
      "Use bucket enumeration tools to find S3 buckets",
      "Check for default credentials in cloud databases",
      "Look for exposed API endpoints and documentation",
      "Review CloudTrail or equivalent audit logs"
    ],
    terminalCommands: [
      "aws", "az", "gcloud", "curl", "jq", "nslookup", "dig"
    ],
    expectedOutcome: "Locate exposed cloud resources containing attacker tools and exfiltrated data"
  },

  Threat_Intel: {
    title: "Threat Intelligence: Predicting the Strike",
    description: "With all intelligence gathered, analyze the attack patterns, indicators of compromise (IOCs), and threat actor behaviors. Predict The Shadows' next move and prepare countermeasures to stop their final attack.",
    objectives: [
      "Compile all IOCs from previous missions",
      "Analyze attack patterns and TTPs (Tactics, Techniques, Procedures)",
      "Correlate threat intelligence with known APT groups",
      "Predict the final attack vector and target",
      "Deploy countermeasures to prevent the attack"
    ],
    hints: [
      "Look for patterns in the timing and targets of attacks",
      "Check threat intelligence feeds for similar IOCs",
      "Analyze the sophistication level of tools used",
      "Consider the attackers' motivations and objectives"
    ],
    terminalCommands: [
      "grep", "awk", "sort", "uniq", "whois", "dig", "curl"
    ],
    expectedOutcome: "Produce a threat intelligence report predicting and preventing the final attack"
  }
};

// Generate story-based missions based on student's weakest skills
export const generateStoryMissions = (
  metrics: SkillMetric[],
  overallScore: number,
  lang: Language = 'en'
): StoryMission[] => {
  // Sort metrics by score (weakest first) and take top 3
  const weakestMetrics = [...metrics].sort((a, b) => a.score - b.score).slice(0, 3);
  const arc = STORY_ARC[lang] || STORY_ARC.en;

  // Map weakest skills to story chapters
  return weakestMetrics.map((metric, index) => {
    const chapter = arc.chapters.find(c => c.skill === metric.category) || arc.chapters[0];
    const template = MISSION_TEMPLATES[metric.category]; // We should localize templates too

    // Determine difficulty based on score
    const difficulty = metric.score < 50 ? 'Recruit' : metric.score < 75 ? 'Operator' : 'Elite';

    // Simple translation for now, Ideally MISSION_TEMPLATES should also be Record<Language, ...>
    // For brevity in this step, I'll only localize the narrative part

    return {
      id: `story-mission-${index + 1}`,
      title: `Chapter ${chapter.chapter}: ${chapter.title}`,
      description: `${chapter.narrative}\n\n${template.description}\n\nDifficulty: ${difficulty} | Your Current Level: ${metric.level} (${metric.score}%)`,
      difficulty,
      status: 'active',
      skillFocus: metric.category,
      storyChapter: chapter.chapter,
      objectives: template.objectives,
      hints: template.hints,
      terminalCommands: template.terminalCommands,
      expectedOutcome: template.expectedOutcome
    };
  });
};

// Get story introduction based on overall score
export const getStoryIntroduction = (overallScore: number): string => {
  if (overallScore >= 80) {
    return `Welcome to Operation: Shadow Network, Elite Operative. Your exceptional skills (${overallScore}%) have earned you a critical assignment. Intelligence suggests a sophisticated threat actor is planning a major cyber attack. Your expertise is needed to stop them.`;
  } else if (overallScore >= 60) {
    return `Welcome to Operation: Shadow Network, Operator. Your solid foundation (${overallScore}%) makes you qualified for this assignment. A mysterious group called 'The Shadows' has been targeting infrastructure. We need your skills to investigate and stop them.`;
  } else {
    return `Welcome to Operation: Shadow Network, Recruit. Your assessment shows potential (${overallScore}%). This mission will be challenging, but it's an opportunity to learn and grow. A threat group called 'The Shadows' is on the move - you'll investigate alongside experienced mentors.`;
  }
};

// Get mission completion narrative
export const getMissionCompletionText = (
  mission: StoryMission,
  nextMission?: StoryMission,
  lang: Language = 'en'
): string => {
  const completionTexts: Record<SkillCategory, string> = {
    Network_Ops: "Excellent work! You've identified the network breach point. The attackers exploited an outdated service - this intel is crucial for the investigation.",
    Web_Security: "Outstanding! You found the backdoor in the web application. This confirms how The Shadows maintain persistent access to compromised systems.",
    Cryptography: "Impressive decryption skills! The intercepted messages reveal critical intelligence about The Shadows' operations and their next target.",
    Linux_Forensics: "Great forensic work! You've recovered crucial evidence and established a timeline. We now understand exactly how the compromise unfolded.",
    Cloud_Defense: "Excellent cloud analysis! You've mapped their infrastructure and found exposed resources. This gives us leverage against their operations.",
    Threat_Intel: "Outstanding threat analysis! Your prediction was spot-on. We've prevented their final attack and neutralized The Shadows' threat."
  };

  let text = completionTexts[mission.skillFocus] || "Mission completed successfully!";

  const arc = STORY_ARC[lang] || STORY_ARC.en;

  if (nextMission) {
    text += `\n\nNext up: ${nextMission.title}. ${arc.chapters.find(c => c.chapter === nextMission.storyChapter)?.narrative || ''}`;
  } else {
    text += "\n\n🎉 Congratulations! You've completed Operation: Shadow Network and successfully stopped The Shadows!";
  }

  return text;
};

export { STORY_ARC };
