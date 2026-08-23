# 06: Repertório fixa uma Versão específica

**What to build:** Um item de Repertório pode apontar pra uma Versão específica de uma música, em vez de sempre a Principal.

**Blocked by:** 1

**Status:** ready-for-agent

- [ ] Associação nova e separada entre um item de Repertório e uma Versão específica de uma de suas músicas — sem alterar a lista ordenável de músicas do repertório já existente (nem sua estrutura, nem o arrastar-e-soltar)
- [ ] Música sem associação: repertório mostra sempre a Principal atual, comportamento idêntico ao de hoje
- [ ] UI do Repertório permite escolher uma Versão específica por música do repertório, só quando aquela música tem mais de uma Versão
- [ ] Exibição/impressão de um item de Repertório usa a resolução do ticket 1 pra decidir o conteúdo, considerando a Versão fixada quando existir
- [ ] Apagar uma Versão referenciada por algum item de Repertório é bloqueado (consistente com o ticket 3), indicando quais repertórios referenciam
