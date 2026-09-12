# Cifras Litúrgicas

Domain for cataloguing and displaying liturgical song chord charts: lyrics with chord symbols, chord fingering diagrams, and instrumental tablature, organized by liturgical season.

## Language

**Música**:
The identity record for one liturgical song: title, artist, liturgical season (`tempo`), category, and audit metadata. Holds one or more Versões; exactly one is the Versão Principal. Stored in the `musicas` Firestore collection.
_Avoid_: Song, Cifra (a Música is the identity; Cifra is content that belongs to a Versão — see below)

**Versão**:
One complete, independently-editable rendition of a Música's content: its own Tom, Cifra, and Tablatura. Created either as a duplicate-then-edit of an existing Versão (e.g. a lyric variation for a different day, a simplified arrangement) or by capturing a live-transposed view under a new Tom. Content is a snapshot at creation time — editing one Versão never changes another. Identified to the admin by a free-text `rótulo` (e.g. "Completa", "Simplificada", "Tom do Coral da Manhã"); has no other required structure.
_Avoid_: Arranjo, Variação (fine informally, not as the modeled term)

**Versão Principal**:
The one Versão shown by default wherever a Música is referenced without specifying otherwise (direct links, search results, Repertório entries with no Versão pinned). The first Versão created for a Música becomes principal automatically; an admin can promote a different Versão later. A Música's Versão Principal cannot be deleted while other Versões exist — another Versão must be promoted first.

**Vídeo de Referência**:
A YouTube video linked to a Versão, shown publicly on the cifra page as a performance reference. Optional per Versão: it can be set explicitly, left unset (in which case the Versão inherits the Música's Vídeo de Referência Padrão, if any), or explicitly suppressed to show no video even when the Música has a padrão. Copied like other Versão content when a Versão is duplicated (set, unset, or suppressed — whichever the source had).

**Vídeo de Referência Padrão**:
The Música-level fallback Vídeo de Referência, used by any Versão that has neither its own video nor an explicit suppression. Independent of Versão Principal — promoting a different Versão to principal does not change it.

**Cifra**:
The chord-chart representation of a Versão's lyrics: the sung text with chord symbols placed inline (e.g. `[C] Senhor, tende pie[G]dade`). Stored as the `letraCifra` field. Rendered by `CifraRenderer`, displayed by `CifraViewer`, edited via the `InteractiveCifraEditor`.
_Avoid_: Letra (the words alone, without chords), Partitura

**Tom**:
The musical key a Versão is written in and saved under (e.g. "C", "F#m", "Bb"). A Versão has exactly one saved reference Tom; viewing/printing can transpose the display away from it without altering the saved value. Different Versões of the same Música may have different Toms — that's how "salvar em outro tom" is modeled: it produces a new Versão, not a second Tom on one record. Distinct from Capotraste: Tom (plus any live transposition) is what the song sounds in; Capotraste is a separate layer on top that only changes which chord shapes are shown.

**Capotraste**:
The casa where a physical capo is clamped to play a Versão's Cifra. Purely a display transformation: the chords shown are the shape transposed down for that casa, while the Tom badge keeps reflecting the actual sounding key — Capotraste never changes what key the song sounds in, only which chord shapes are printed. A Versão has one saved default Capotraste (0 meaning none); viewing can override it live without persisting, the same way live transposition already works for Tom. Does not apply to Tablatura, and is not carried over when "salvar em outro tom" creates a new Versão.
_Avoid_: Capo (English mixed into an otherwise Portuguese model), Casa do Capotraste (redundant — the Capotraste value already is a casa)

**Diagrama de Acorde**:
A static illustration of one chord's finger positions across the 6 cordas at a single moment — which casa to press on each corda, or which corda to leave solta or abafada. Looked up by chord symbol from the `dicionarioAcordes`, rendered by `ChordDiagram`. Always reflects the chord as currently displayed (after any transposition and Capotraste), never the underlying saved Tom.
_Avoid_: Tablatura (a diagram is one static shape; a tablatura is a sequence of shapes over time)

**Tablatura**:
The set of Seções de Tablatura registered for a Versão: instrumental passages (intro, riff, solo) notated as sequences of Notas on the 6-corda neck, instead of chord symbols. Distinct from Cifra (chord-symbol text over lyrics) and from Diagrama de Acorde (one static chord shape). When a new Versão is created, its Tablatura starts as an unmodified copy of the source Versão's — Toms differ, but fret positions are not automatically re-derived for the new key.

**Seção de Tablatura**:
One individually named, ordered sequence within a Música's Tablatura (e.g. "Intro", "Solo"). The unit an admin creates, edits, or deletes; sections display in the order they were registered — there is no manual reordering.
_Avoid_: Trecho, Riff (fine as an informal description, not as the modeled term)

**Passo**:
One moment in time within a Seção de Tablatura: a vertical slice across all 6 cordas, holding zero to six Notas played simultaneously.
_Avoid_: Coluna, Tempo, Compasso (a compasso is a full musical measure; a Passo is a single instant, not a measure)

**Nota** (de tablatura):
A corda+casa value inside a Passo — the pitched case. A corda with no Nota at all in a given Passo is simply absent from that Passo (structural "not played here"), distinct from both a Nota and a Nota Abafada.
_Avoid_: Toque

**Nota Abafada**:
A Nota played on a corda in a given Passo with no defined pitch — a percussive dead-note hit. Occupies a slot in the Passo like a regular Nota, but carries no `casa` and can never carry a Técnica de Execução. Not itself a Técnica de Execução, despite colloquially being grouped with them (hammer-on, slide, etc.) in tab-notation folklore — it's a different variant of Nota, structurally excluded from the técnica field entirely.
_Avoid_: Corda abafada (as a synonym for the whole technique category), Dead note

**Técnica de Execução**:
An optional marking on a Nota (pitched only — a Nota Abafada can never carry one) describing how it's played beyond its casa: Ligadura, Slide, or Vibrato. At most one per Nota.

**Ligadura**:
A Técnica de Execução connecting a Nota to the Nota on the same corda in the next Passo, played without re-picking the corda. Covers both hammer-on (ascending) and pull-off (descending) as a single concept — the direction shown is derived by comparing the two casas, never stored separately. Has no visible effect if the next Passo has no Nota on that corda.
_Avoid_: Hammer-on, Pull-off (as separately stored values — they're the same Ligadura, distinguished only by displayed direction)

**Slide**:
A Técnica de Execução connecting a Nota to the Nota on the same corda in the next Passo, sliding while keeping contact with the corda. Direction (up/down) is derived from comparing the two casas, never stored separately. Has no visible effect if the next Passo has no Nota on that corda.

**Vibrato**:
A Técnica de Execução marking pitch oscillation on a single Nota. Unlike Ligadura and Slide, it has no relationship to any other Nota and does not affect transposition.

**Casa**:
A fret position on the neck: an integer from 0 (corda solta) upward. Casa numbers on a Nota are always absolute — unlike `ChordShape.baseFret`, a Passo has no visual windowing. Also the unit a Capotraste is expressed in, but there it's a single value for a whole Versão's display, not a per-Nota value inside a Passo.
