import type { DeckId } from "../../types/mixer";

/**
 * Input de arquivo escondido, um por deck. O dispatcher só pede o click
 * via `openFilePicker`; o React é quem tem o DOM.
 *
 * @param props Deck e callback quando o aluno escolhe um arquivo.
 */
export function DeckFileInput({
  id,
  onFile,
}: {
  id: DeckId;
  onFile: (file: File) => void;
}) {
  return (
    <input
      type="file"
      hidden
      accept="audio/*"
      data-deck-file={id}
      tabIndex={-1}
      aria-label={`Arquivo deck ${id.toUpperCase()}`}
      onChange={(event) => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        if (file) onFile(file);
      }}
    />
  );
}

/**
 * Dispara o picker do deck, usado pelo `onUiOp` do dispatcher.
 *
 * @param deckId Deck cujo input será clicado.
 */
export function openDeckFilePicker(deckId: DeckId): void {
  const input = document.querySelector<HTMLInputElement>(`input[data-deck-file="${deckId}"]`);
  input?.click();
}
