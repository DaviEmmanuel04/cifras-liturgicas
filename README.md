# 📜 Cifras Litúrgicas • Paróquia de Santo Antônio

Uma aplicação web moderna, rápida e otimizada (Progressive Web App) desenvolvida para os ministros de música da **Paróquia de Santo Antônio** em Antônio Martins - RN. O sistema permite gerenciar repertórios de missas e acessar cifras de forma offline diretamente do altar, com recursos de transposição de tom, rolagem automática e impressão inteligente.

---

## 🌟 Recursos Principais

### 📱 PWA Instalável & Funcionamento 100% Offline
* **Instalação Direta**: Adicione o aplicativo à tela inicial em dispositivos Android, iOS e Computadores (através do manifesto PWA).
* **Persistência de Dados**: Integração com o cache local do Firestore (`persistentLocalCache` com IndexedDB) para carregar cifras previamente acessadas sem internet.
* **Service Worker Otimizado**: Estratégias de cache para inicialização instantânea e economia de dados móveis no presbitério.

### 🎨 Design Premium & Cores Litúrgicas Dinâmicas
* **Estilo Papel/Missal**: Fundo no tom creme/marfim sutil (`#f4f0e6`) e tipografia elegante combinando as fontes **Lora** (serifada clássica) e **Outfit** (moderna e legível).
* **Sincronização Litúrgica**: Motor de temas que adapta as cores de destaque da interface (Verde, Roxo, Vermelho, Branco, Rosa, Azul ou Preto) baseado no calendário oficial da Igreja (via API litúrgica) ou escolha manual rápida no cabeçalho.
* **Badges Indicativas**: Cards de músicas identificados com bolinhas de cores litúrgicas dinâmicas para facilitação rápida.

### 🎼 Visualizador Dinâmico de Cifras
* **Transposição de Tom**: Altere a tonalidade de qualquer cifra em tempo real com cálculo dinâmico de semitons, destacando a tonalidade original do acervo.
* **Tamanho de Letra Ajustável**: Aumente ou diminua o tamanho da fonte para a melhor distância visual no púlpito.
* **Diagramas de Acordes**: Exibição visual de acordes simplificados com opção de ocultar para foco na letra.

### 📜 Rolagem Automática Suave (Performance-focused)
* **Sem Engasgos (Anti-stutter)**: Motor atualizado para rodar em sincronia com a taxa de atualização da tela através de `requestAnimationFrame`.
* **Ajuste de Velocidade**: 5 opções de controle de leitura (`0.5x`, `0.75x`, `1.0x`, `1.5x`, `2.0x`) com recálculo e transição imediata.
* **Economia de Energia**: O motor de rolagem pausa a renderização de quadros automaticamente quando o app entra em segundo plano.

### 🖨️ Impressão e PDF Profissionais
* **Duas Colunas Automáticas**: Aproveitamento máximo de papel, evitando quebras desnecessárias.
* **Identificação Oficial**: O logotipo principal da Paróquia de Santo Antônio aparece no topo direito da folha impressa (com filtro de escala de cinza para economia de tinta) de forma totalmente invisível na tela digital.
* **Diagramas no Final**: Os acordes utilizados na música são agrupados de forma organizada no fim da folha física.

### 🔗 Metadados Ricos de Compartilhamento (SEO/Social)
* **Dynamic Server Render (SSR)**: Rota de exibição estruturada como Server Layout híbrido para gerar tags Open Graph/Twitter com velocidade.
* **Previews Completos**: Links compartilhados no WhatsApp, Telegram e Facebook exibem o nome da música, artista, categoria, tempo litúrgico e tom original.

### 🔐 Painel Administrativo Completo
* **Autenticação**: Acesso restrito via Firebase Authentication com proteção estrita de carregamento de rotas (sem vazamento visual antes de carregar).
* **Editor Litúrgico**: Permite criar, editar, categorizar músicas e arrumar a sequência de canções de missas através de arrastar e soltar (Drag and Drop com `@dnd-kit`).

---

## 🛠️ Stack Tecnológica

* **Core**: [React 19](https://react.dev/) & [Next.js 15 (App Router)](https://nextjs.org/)
* **Compilação**: [Turbopack](https://nextjs.org/docs/app/api-reference/turbopack)
* **Banco de Dados**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
* **Autenticação**: [Firebase Authentication](https://firebase.google.com/docs/auth)
* **Ícones**: [Lucide React](https://lucide.dev/)
* **Organização Física**: [@dnd-kit](https://dndkit.com/) para drag-and-drop
* **Estilização**: Tailwind CSS

---

## 📁 Estrutura de Pastas

```text
├── public/                  # Arquivos estáticos (imagens, manifesto, sw.js)
├── src/
│   ├── app/                 # Estrutura de rotas e layouts do Next.js (App Router)
│   │   ├── admin/           # Painel Administrativo, Login, Dashboard e Editores
│   │   ├── musica/          # Visualização pública das Cifras e Server Layout
│   │   ├── layout.tsx       # Layout raiz (Provedores, SW e Metadados Globais)
│   │   └── page.tsx         # Página Inicial (Catálogo e Repertório do Dia)
│   ├── components/          # Componentes React (Navbar, Lista, Visualizador, etc.)
│   ├── lib/                 # Inicialização do Firebase (Auth e Firestore cache)
│   └── utils/               # Utilitários (Mapeador litúrgico e transpositor de acordes)
├── firestore.rules          # Regras de segurança locais para deploy no Firebase
└── firebase.json            # Configurações do ambiente de desenvolvimento Firebase
```

---

## ⚙️ Configuração e Desenvolvimento Local

### 1. Pré-requisitos
Certifique-se de possuir o [Node.js](https://nodejs.org/) instalado.

### 2. Clonar o Repositório e Instalar Dependências
```bash
git clone https://github.com/DaviEmmanuel04/cifras-liturgicas.git
cd cifras-liturgicas
npm install
```

### 3. Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto contendo as credenciais de seu projeto Firebase (use como base as chaves em `.env.local` que já estão associadas ao banco de produção):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id

# Integração opcional com Inteligência Artificial para importação/conversão de cifras
DEEPSEEK_API_KEY=sua_chave_de_api_deepseek
```

### 4. Rodar Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador.

### 5. Compilar para Produção (Build)
Para testar a geração estática das páginas e regras do servidor:
```bash
npm run build
npm run start
```

---

## 🔒 Regras de Segurança do Banco de Dados
A segurança do banco de dados está descrita no arquivo `firestore.rules`. As regras são:

* **Leitura (`read`)**: Pública para todas as coleções (`musicas`, `repertorios`, `config`), assegurando que fiéis e músicos acessem as cifras sem precisar logar.
* **Escrita (`write`)**: Apenas para administradores autenticados (`request.auth != null`).

Para atualizar as regras diretamente via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 📄 Licença e Uso
Este projeto é de uso exclusivo da **Paróquia de Santo Antônio de Pádua** (Diocese de Mossoró) no município de Antônio Martins - RN. Desenvolvido para facilitar a liturgia e a oração comunitária através da música.
