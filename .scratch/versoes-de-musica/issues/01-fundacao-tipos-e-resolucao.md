# 01: Fundação: tipos de Versão e resolução de qual conteúdo mostrar

**What to build:** Os tipos de dado da Versão e a função pura que decide qual conteúdo mostrar dado uma Música e um identificador de Versão opcional. Nenhuma tela consome isso ainda — verificável sozinho via testes.

**Blocked by:** Nenhuma (pode começar imediatamente)

**Status:** ready-for-agent

- [ ] Tipo de dado da Versão definido: identificador estável, rótulo de texto livre, Tom, Cifra, Tablatura, e metadados de auditoria (quem/quando criou e alterou)
- [ ] A Música ganha uma coleção opcional dessas Versões e um indicador de qual delas é a Principal — ambos ausentes por padrão; nenhum documento existente precisa de migração
- [ ] Função pura de resolução: sem identificador informado, retorna o conteúdo da Principal (dos campos da própria Música quando a coleção não existe, ou da Versão indicada como principal quando existe); com um identificador de uma Versão existente, retorna aquela Versão; com um identificador que não existe mais, cai pra Principal sem erro
- [ ] Testes cobrem os quatro casos acima
- [ ] A função não depende de Firestore nem de UI
