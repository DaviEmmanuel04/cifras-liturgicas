# 02: Criar a segunda Versão de uma Música

**What to build:** O fluxo pelo qual o admin transforma uma Música de versão única em duas Versões nomeadas — duplica o conteúdo atual, edita a cópia livremente, e ao salvar o sistema pede o rótulo da Versão nova e sugere (editável) um rótulo pra que já existia.

**Blocked by:** 1

**Status:** ready-for-agent

- [ ] Ação de duplicar a Versão atual da Música disponível na tela onde ela já é editada, copiando o conteúdo (Tom, Cifra, Tablatura) pra edição livre antes de salvar
- [ ] Salvar essa cópia como a primeira Versão adicional de uma Música: pede o rótulo da Versão nova e sugere (editável) um rótulo pra Versão que já existia, antes de confirmar
- [ ] Depois de salvar, a Música passa a ter a coleção de Versões (do ticket 1) com as duas, e a que já existia continua marcada como Principal
- [ ] Criar essa Versão nova é bloqueado enquanto houver qualquer edição pendente não salva no formulário principal da Música
- [ ] O comportamento de uma Música com uma única Versão continua idêntico ao atual até esse fluxo ser usado pela primeira vez
