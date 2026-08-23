# 03: Gerenciar Versões existentes

**What to build:** Com 2+ Versões já existindo, o admin consegue renomear, apagar (com os dois bloqueios de segurança) e promover qualquer uma a Principal, tudo na mesma tela onde já edita a música.

**Blocked by:** 2

**Status:** ready-for-agent

- [ ] Lista das Versões de uma Música (rótulo e Tom de cada) na tela de edição, com a Principal identificada visualmente
- [ ] Renomear o rótulo de qualquer Versão existente
- [ ] Apagar uma Versão: bloqueado se for a Principal e existir qualquer outra Versão; bloqueado também se estiver fixada em algum item de Repertório (mensagem indicando o motivo em cada caso)
- [ ] Promover uma Versão não-principal a Principal: o conteúdo dela passa a ser o da Principal, o indicador de qual é a Principal é atualizado, e nenhum identificador de Versão é destruído ou reaproveitado na troca
- [ ] Toda edição feita pelo formulário principal da Música, a partir de quando a coleção de Versões existe, também atualiza o registro correspondente à Principal dentro dessa coleção — nunca só os campos de topo
