Status: ready-for-agent

# Versões de Música (letra alternativa + salvar em outro tom)

## Problem Statement

Hoje uma Música guarda um único Tom e uma única Cifra. Não há como registrar que a mesma música tem uma versão completa e outra simplificada, nem uma pequena variação de letra usada só em dias específicos. A transposição de tom já existe, mas é puramente uma transformação de tela — nunca é salva — então não há como registrar em que Tom uma música foi de fato ensaiada com um coral específico, nem mandar pra esse coral um link que já abra direto naquele Tom.

## Solution

Uma Música passa a poder ter uma ou mais **Versões**, cada uma com seu próprio Tom, Cifra e Tablatura, identificada por um rótulo livre (ex. "Completa", "Simplificada", "Tom do Coral da Manhã"). Enquanto uma Música só tem uma Versão — o caso comum, hoje — nada muda visivelmente nem estruturalmente. No momento em que o admin cria a segunda Versão, a que já existia é nomeada também (sugestão automática, editável), e as duas passam a conviver como registros independentes.

Toda Música tem sempre uma **Versão Principal**: a exibida por padrão sempre que a Música é referenciada sem especificar outra coisa. É a primeira Versão criada; pode ser trocada depois, mas nunca apagada enquanto houver outras Versões.

Uma Versão nova nasce de dois jeitos: duplicando e editando uma Versão existente (cobre letra alternativa e versão simplificada), ou transpondo ao vivo no preview que o admin já usa hoje e salvando o resultado como uma Versão nova nesse Tom (cobre o registro de "qual Tom foi ensaiado com qual coral").

Quem visita a página pública de uma Música com mais de uma Versão vê um seletor pra escolher qual ler, e a escolha fica refletida na URL — um link específico pode ser mandado direto pro coral certo, já aberto na versão/tom combinado. Um item de Repertório também pode fixar qual Versão usar, em vez de sempre a Principal.

## User Stories

1. Como admin, quero duplicar uma Versão existente de uma Música e editar a cópia livremente, para criar uma variação de letra usada num dia específico sem afetar a versão original.
2. Como admin, quero duplicar uma Versão e simplificá-la, para oferecer uma versão mais fácil de tocar da mesma música.
3. Como admin, quero transpor a Cifra no preview que já uso hoje e salvar o resultado como uma Versão nova, para registrar em que Tom a música foi ensaiada com um coral específico.
4. Como admin, ao criar a segunda Versão de uma Música que só tinha uma, quero que o sistema me peça um rótulo tanto pra ela quanto pra que já existia (com uma sugestão pronta pra esta última, que posso editar), para as duas ficarem identificáveis dali em diante.
5. Como admin, quero ver a lista de Versões de uma Música na própria tela onde já edito a música, para não precisar navegar pra outro lugar.
6. Como admin, quero renomear o rótulo de uma Versão a qualquer momento, para corrigir ou refinar como ela é identificada.
7. Como admin, quero apagar uma Versão que não faz mais sentido, para manter a lista de versões enxuta.
8. Como admin, quero que o sistema impeça apagar a Versão Principal enquanto existirem outras Versões, para nunca ficar sem uma versão principal por engano.
9. Como admin, quero promover uma Versão não-principal a Principal, para trocar qual é mostrada por padrão sem perder o conteúdo de nenhuma das duas.
10. Como admin, quero que criar uma Versão nova exija que eu tenha salvado qualquer edição pendente no formulário da música primeiro, para nunca ter dúvida sobre a partir de que conteúdo a nova versão foi gerada.
11. Como admin, quero que a Tablatura de uma Versão nova venha copiada como está (sem re-transposição automática das casas), para poder ajustá-la manualmente quando o Tom mudar, em vez de confiar numa transposição de tablatura que a própria feature não garante.
12. Como visitante que abre uma Música com mais de uma Versão, quero um seletor pra escolher qual ver, para ler a letra e o tom certos pro meu contexto (ex. a versão simplificada).
13. Como visitante que escolhe uma Versão diferente da Principal, quero que a URL reflita essa escolha, para poder compartilhar ou salvar um link que abre direto naquela versão.
14. Como visitante que abre uma Música sem especificar versão, quero ver a Versão Principal, para o comportamento de hoje continuar valendo sem nenhuma mudança pra quem nunca usa a feature.
15. Como visitante que abre um link salvo apontando pra uma Versão que já foi apagada, quero cair de volta pra Versão Principal sem erro nem tela em branco, para o link antigo continuar útil mesmo que desatualizado.
16. Como visitante, quero que transposição ao vivo e impressão continuem funcionando exatamente como hoje, só que sobre a Versão selecionada em vez da música inteira, para não perder nenhuma funcionalidade existente.
17. Como quem monta um Repertório, quero fixar qual Versão de uma Música aquele item usa, para registrar qual Tom foi combinado pra aquela celebração ou ensaio.
18. Como quem monta um Repertório, quero que uma música sem versão fixada continue mostrando sempre a Principal atual, para o comportamento de hoje não mudar pra repertórios que nunca usam a feature.
19. Como quem monta um Repertório, quero que apagar uma Versão fixada em algum repertório seja bloqueado até eu desvincular essa referência, para o repertório nunca quebrar silenciosamente.
20. Como desenvolvedor, quero que toda escrita na Versão Principal feita pelo formulário normal também atualize o registro correspondente dela entre as demais Versões (a partir do momento em que existem outras), para nenhuma referência a essa versão por identificador — de um Repertório, por exemplo — nunca ler conteúdo desatualizado.

## Implementation Decisions

- **Modelo**: uma Versão é um registro de conteúdo com Tom, Cifra e Tablatura próprios, mais um rótulo de texto livre e metadados de auditoria (quem/quando criou e alterou). Uma Música ganha uma coleção opcional dessas Versões e um indicador de qual delas é a atual Principal — ambos ausentes enquanto a Música só tem uma Versão, caso em que o Tom/Cifra/Tablatura da música continuam sendo o conteúdo dessa única versão, exatamente como hoje. A coleção só passa a existir no momento em que uma segunda Versão é criada; nesse momento a Versão até então implícita (a única que existia) recebe um identificador estável e o rótulo que o admin escolher.
- **Sincronização**: a partir do momento em que a coleção de Versões existe, qualquer edição feita através do formulário normal de edição da música — que continua editando "a Principal" diretamente — também atualiza o registro correspondente dentro da coleção. Isso garante que qualquer código que resolva uma Versão por identificador (a resolução pública, ou um Repertório com uma Versão fixada) nunca leia conteúdo desatualizado, mesmo quando o identificador resolvido é o da própria Principal.
- **Promoção de Principal**: promover uma Versão diferente copia o conteúdo dela pro lugar hoje ocupado pela Principal e atualiza qual identificador é o principal. Nenhum identificador de Versão é destruído ou reaproveitado nessa operação — é assim que uma referência externa (um Repertório) continua válida independente de qual Versão está marcada como principal no momento.
- **Criação de Versão nova**: sempre parte de uma Versão existente já salva (nunca de edições pendentes no formulário) — ou por duplicação direta (o admin edita a cópia livremente antes de salvar como nova), ou pelo fluxo de transposição: o admin transpõe ao vivo no preview que já existe hoje, e salvar gera uma Cifra nova com os acordes já reescritos no Tom transposto, mantendo a Tablatura copiada sem alteração de casas.
- **Exclusão bloqueada**: apagar a Versão Principal é bloqueado enquanto existir qualquer outra Versão da mesma música; apagar qualquer Versão (principal ou não) que esteja fixada por um item de Repertório também é bloqueado até o vínculo ser desfeito.
- **Resolução de versão**: um único ponto de decisão determina qual conteúdo mostrar dado uma Música e, opcionalmente, um identificador de Versão — sem identificador (ou identificador que não existe mais), cai pra Principal; com um identificador válido, retorna aquela Versão. Esse ponto único é reaproveitado pela página pública (a partir de um parâmetro na própria URL, pra permitir link compartilhável e voltável) e pela exibição de um item de Repertório (a partir da Versão que aquele item eventualmente fixou).
- **Repertório**: fixar uma Versão por item de repertório é uma associação adicional (música → versão escolhida), guardada separadamente da lista ordenável de músicas do repertório que já existe hoje — sem alterar a estrutura ou o comportamento de arrastar-e-soltar já existente.

## Testing Decisions

- Bons testes aqui exercitam comportamento externo puro, sem Firestore nem UI — mesmo padrão já usado pela transposição de acordes e de tablatura existentes no projeto.
- A função de resolução de versão é o seam de maior alavancagem: cobrir música com uma única versão (sem coleção), música com Principal e outras Versões, identificador de versão válido, identificador que não existe mais (fallback pra Principal).
- A geração de Cifra já transposta (reescrever cada acorde reconhecido usando a transposição de acorde já existente e testada) cobre: texto sem nenhum acorde, texto com vários acordes, e um token que não é um acorde reconhecido — não deve quebrar o texto, só permanecer como está.
- Fluxos de UI (gestão de versões no admin, seletor público, associação no Repertório) seguem o padrão já estabelecido no projeto: exercitados manualmente, sem biblioteca de teste de componente.

## Out of Scope

- Re-transposição automática de Tablatura (deslocar número de casa) ao criar uma Versão em outro Tom — a Tablatura é sempre copiada como está.
- Propagação de edições entre Versões depois de criadas — cada uma é uma cópia independente a partir do momento em que nasce.
- Migração de Músicas existentes para um formato em que toda Música sempre tem uma coleção de Versões — a coleção só passa a existir quando uma segunda Versão é de fato criada.
- Qualquer taxonomia fixa de tipo de Versão (ex. um conjunto pré-definido "completa"/"simplificada") — o rótulo é sempre texto livre, sem categorias.
- Busca ou filtro por rótulo de Versão na listagem geral de Músicas.

## Further Notes

- Vocabulário de domínio já registrado no glossário do projeto (Versão, Versão Principal, e as definições atualizadas de Música, Cifra, Tom e Tablatura) e a decisão de armazenamento já registrada como ADR, ambos produzidos durante a sessão de domain-modeling que precedeu este spec.
- Este spec sintetiza uma sessão de `/grill-with-docs` já concluída — todas as decisões acima foram confirmadas com o usuário durante essa sessão, não inferidas.
