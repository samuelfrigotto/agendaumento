# Redes na Prática — VPC, Sub-redes, Rotas, NAT

## O que você provavelmente já sabe

- IP é um endereço de rede
- Existe IP público e IP privado
- Porta 80 é HTTP, 443 é HTTPS, 22 é SSH
- DNS converte nomes em IPs

---

## A Analogia que Facilita Tudo

Imagine um **condomínio**:
- O **condomínio inteiro** = VPC (seu espaço privado isolado na nuvem)
- Os **blocos de apartamentos** = Sub-redes (divisões dentro da VPC)
- A **portaria** = Internet Gateway (único ponto de entrada/saída pública)
- O **interfone** = NAT Gateway (moradores ligam para fora, de fora não entra)
- As **regras do condomínio** = Route Tables (de onde vem, para onde vai o tráfego)
- O **segurança** = Security Group / ACL (quem pode entrar em qual bloco)

---

## Conceitos de Redes

### IP Address — Endereço IP
Identificador numérico único de um dispositivo em uma rede. Existem duas versões:
- **IPv4**: 32 bits, formato `192.168.1.100` (cerca de 4 bilhões de endereços)
- **IPv6**: 128 bits, formato `2001:db8::1` (praticamente infinito)

### CIDR — Classless Inter-Domain Routing
Notação para expressar um bloco de endereços IP. O número após `/` indica quantos bits são fixos (a "parte da rede").

```
10.0.0.0/16   →  65.536 endereços  (10.0.0.0 até 10.0.255.255)
10.0.1.0/24   →  256 endereços     (10.0.1.0 até 10.0.1.255)
10.0.1.0/28   →  16 endereços      (10.0.1.0 até 10.0.1.15)
```

**Regra prática**: quanto maior o número após `/`, menor o bloco.
- `/16` = muitos IPs (rede grande, ex: VPC inteira)
- `/24` = 256 IPs (sub-rede típica)
- `/32` = 1 único IP (um host específico)

### IP Privado vs IP Público

**IPs privados** — usados dentro de redes internas, não roteáveis na internet:
```
10.0.0.0/8         (10.x.x.x)
172.16.0.0/12      (172.16.x.x até 172.31.x.x)
192.168.0.0/16     (192.168.x.x)
```

**IPs públicos** — roteáveis na internet, únicos globalmente.

### DNS — Domain Name System
Sistema que traduz nomes legíveis (`google.com`) em endereços IP (`142.250.80.46`).
```bash
nslookup google.com
dig google.com
host google.com
```

---

## VPC — Virtual Private Cloud

Uma **rede virtual isolada** dentro da infraestrutura de nuvem (AWS, GCP, Azure). É como ter seu próprio datacenter privado dentro da nuvem, totalmente controlado por você.

**O que você define numa VPC:**
- O bloco de IPs privados que ela usará (ex: `10.0.0.0/16`)
- Quais sub-redes existem dentro dela
- Quais rotas o tráfego deve seguir
- Quais recursos podem acessar a internet

**Características:**
- Isolada de outras VPCs por padrão (mesmo na mesma conta)
- Abrange todas as zonas de disponibilidade de uma região
- Você pode ter múltiplas VPCs (padrão AWS: 5 por região)

```
AWS Region: us-east-1
└── VPC: 10.0.0.0/16
    ├── Sub-rede Pública:  10.0.1.0/24  (us-east-1a)
    ├── Sub-rede Pública:  10.0.2.0/24  (us-east-1b)
    ├── Sub-rede Privada:  10.0.10.0/24 (us-east-1a)
    └── Sub-rede Privada:  10.0.20.0/24 (us-east-1b)
```

---

## Sub-rede — Subnet

**Divisão de uma VPC** em segmentos menores. Cada sub-rede existe em uma única Zona de Disponibilidade (AZ).

**Sub-rede pública** — tem rota para um Internet Gateway. Recursos aqui podem ter IP público e se comunicar com a internet diretamente.
- Exemplo de uso: Load Balancer, servidor web que recebe tráfego externo

**Sub-rede privada** — não tem rota direta para a internet. Recursos aqui só se comunicam entre si ou via NAT Gateway.
- Exemplo de uso: banco de dados, servidores de aplicação, backend

**Por que dividir em sub-redes?**
- Segurança: banco de dados em sub-rede privada não é acessível da internet
- Isolamento: falha em uma zona não afeta outras
- Controle de custos: tráfego interno é gratuito

```bash
# Em um servidor Linux dentro de uma sub-rede, ver o IP
ip addr show eth0
ip route show

# Ver a qual sub-rede pertence
curl http://169.254.169.254/latest/meta-data/local-ipv4     # AWS
curl http://169.254.169.254/latest/meta-data/subnet-id      # AWS
```

---

## Internet Gateway (IGW)

**Componente que conecta sua VPC à internet pública.** É um gateway gerenciado, escalável e altamente disponível.

- É necessário para que recursos em sub-redes públicas se comuniquem com a internet
- Um IGW por VPC
- Realiza NAT para instâncias com IP público (traduz o IP privado para o IP público elasticamente)

**Sem IGW**: sua VPC é completamente isolada da internet.
**Com IGW + rota configurada**: sub-redes públicas têm acesso à internet.

---

## Route Table — Tabela de Rotas

**Define para onde o tráfego de rede deve ser enviado** com base no destino. Cada sub-rede tem uma route table associada.

**Formato de uma rota:**
```
Destino (Destination)  →  Alvo (Target)
```

**Exemplo — Route Table de sub-rede pública:**
```
Destination     Target
10.0.0.0/16     local          ← tráfego interno fica dentro da VPC
0.0.0.0/0       igw-xxxxxxxx   ← todo o resto vai para o Internet Gateway
```

**Exemplo — Route Table de sub-rede privada:**
```
Destination     Target
10.0.0.0/16     local          ← tráfego interno fica dentro da VPC
0.0.0.0/0       nat-xxxxxxxx   ← todo o resto vai para o NAT Gateway
```

**Como o roteamento funciona:**
1. O tráfego chega com um IP de destino
2. A route table verifica da rota mais específica para a menos específica
3. `/32` > `/24` > `/16` > `/0` (mais específico vence)
4. Envia o pacote para o alvo correspondente

---

## NAT Gateway — Network Address Translation

**Permite que recursos em sub-redes privadas acessem a internet sem serem acessíveis da internet.**

**Problema que resolve**: Servidores de banco de dados em sub-redes privadas precisam baixar atualizações, mas não devem ser expostos à internet.

**Como funciona:**
```
Servidor privado (10.0.10.5)
    → pacote sai para 0.0.0.0/0
    → vai para o NAT Gateway (que fica na sub-rede pública, tem IP público)
    → NAT substitui o IP de origem (10.0.10.5) pelo IP público do NAT
    → pacote vai para a internet
    → resposta volta para o IP público do NAT
    → NAT devolve para 10.0.10.5
```

**Características:**
- Unidirecional: de dentro para fora. De fora para dentro é bloqueado.
- Custa dinheiro na AWS (por hora + por GB transferido)
- Fica em uma sub-rede pública, precisa de Elastic IP
- Altamente disponível por zona

**NAT Gateway vs NAT Instance:**
| Item           | NAT Gateway          | NAT Instance           |
|----------------|----------------------|------------------------|
| Gerenciamento  | AWS gerencia         | Você gerencia          |
| Disponibilidade| Alta, automática     | Você configura         |
| Desempenho     | Escala automaticamente| Limitado pelo tipo da EC2|
| Custo          | Mais caro            | Mais barato            |
| Uso recomendado| Produção             | Ambientes de teste     |

---

## Security Group — Grupo de Segurança

**Firewall virtual que controla o tráfego de entrada (inbound) e saída (outbound) de recursos** (instâncias EC2, RDS, etc.).

**Características:**
- Stateful: se você permite a entrada, a resposta sai automaticamente
- Por padrão: tudo bloqueado na entrada, tudo permitido na saída
- Trabalha com regras de ALLOW (não tem regras de DENY)
- Vinculado a uma instância (não a uma sub-rede)

**Exemplo de regras:**
```
Inbound Rules (Entrada):
Tipo        Protocolo  Porta    Origem
HTTP        TCP        80       0.0.0.0/0          ← qualquer lugar
HTTPS       TCP        443      0.0.0.0/0          ← qualquer lugar
SSH         TCP        22       203.0.113.5/32     ← somente seu IP
MySQL       TCP        3306     sg-webservers      ← somente do security group dos web servers
```

---

## Network ACL — Lista de Controle de Acesso

**Firewall no nível da sub-rede** (diferente do Security Group que é no nível da instância).

| Item       | Security Group           | Network ACL                        |
|------------|--------------------------|------------------------------------|
| Nível      | Instância                | Sub-rede                           |
| Estado     | Stateful (rastreia)      | Stateless (regras para ida E volta)|
| Regras     | Somente ALLOW            | ALLOW e DENY                       |
| Avaliação  | Todas as regras juntas   | Em ordem numérica                  |

---

## VPC Peering

**Conexão de rede entre duas VPCs** que permite que recursos se comuniquem usando IPs privados, como se estivessem na mesma rede.

- Pode ser entre VPCs da mesma conta ou contas diferentes
- Pode ser entre regiões diferentes (inter-region peering)
- Não é transitivo: A ↔ B e B ↔ C não significa A ↔ C

---

## Ferramentas de Diagnóstico de Rede no Linux

```bash
# Testar conectividade básica
ping 8.8.8.8
ping google.com

# Rastrear o caminho dos pacotes
traceroute google.com
tracepath google.com

# Testar porta específica
telnet google.com 80
nc -zv google.com 443     # netcat

# Ver rotas do sistema
ip route show
route -n

# Ver interfaces de rede
ip addr show
ifconfig         # versão antiga

# Ver conexões ativas e portas escutando
ss -tuln         # portas abertas
ss -tulnp        # com processo responsável
netstat -tuln    # alternativa mais antiga

# Resolução DNS
nslookup google.com
dig google.com
dig google.com MX        # registros MX (email)
dig +short google.com    # somente o IP

# Ver ARP (IPs para MAC na rede local)
arp -n

# Testar download/upload de uma URL
curl -o /dev/null -s -w "%{speed_download}\n" https://google.com

# Capturar tráfego de rede (precisa de sudo)
tcpdump -i eth0 port 80
tcpdump -i eth0 host 8.8.8.8
```

---

## Exercício Prático — Entender sua rede atual

```bash
# 1. Qual é o IP da sua máquina/servidor?
ip addr show eth0 | grep "inet "

# 2. Qual é o gateway padrão?
ip route show | grep default

# 3. Qual é o servidor DNS?
cat /etc/resolv.conf

# 4. Seu IP público
curl ifconfig.me
curl icanhazip.com

# 5. Traceroute para o Google
traceroute 8.8.8.8

# 6. Quais portas estão abertas no servidor?
ss -tulnp
```

---

## Fluxo Completo: Requisição de um Usuário até o Banco de Dados

```
Usuário (internet)
    ↓ HTTPS:443
Internet Gateway (IGW)
    ↓
Sub-rede Pública — 10.0.1.0/24
    └── Load Balancer (IP público + Security Group: porta 443 de 0.0.0.0/0)
        ↓ HTTP:80
Sub-rede Privada — 10.0.10.0/24
    └── Servidor de Aplicação (sem IP público + Security Group: porta 80 somente do LB)
        ↓ MySQL:3306
Sub-rede Privada — 10.0.20.0/24
    └── Banco de Dados RDS (sem IP público + Security Group: porta 3306 somente do app)
```

```
Servidor de Aplicação precisando atualizar pacotes:
    Servidor (10.0.10.5)
    ↓ route: 0.0.0.0/0 → nat-gateway
    NAT Gateway (sub-rede pública, IP elástico: 54.x.x.x)
    ↓
Internet → repositório apt/yum
    ↑ resposta volta pelo mesmo caminho
```
