# 04: Salvar em outro tom

**What to build:** No preview com transposição ao vivo que o admin já usa hoje, um jeito de salvar o resultado transposto como uma Versão nova — a Cifra sai com os acordes já reescritos no novo Tom, a Tablatura é copiada sem alteração de casas.

**Blocked by:** 1, 2

**Status:** ready-for-agent

- [ ] Preview de edição ganha os mesmos controles de transposição por semitom que a visualização pública já tem
- [ ] Ação de salvar o resultado transposto como Versão nova: gera uma Cifra com cada acorde reconhecido já reescrito no tom transposto (token que não é um acorde reconhecido permanece como está, sem quebrar o texto) e usa esse tom como o da Versão nova
- [ ] Tablatura da Versão nova é copiada sem nenhuma alteração de casa
- [ ] Reaproveita o mesmo fluxo de nomeação do ticket 2 quando essa for a segunda Versão da Música
- [ ] Mesma exigência do ticket 2: bloqueado enquanto houver edição pendente não salva no formulário principal
- [ ] Testes cobrem a geração da Cifra transposta: texto sem acordes, texto com vários acordes, token não reconhecido
