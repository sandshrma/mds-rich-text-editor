import { EditorState, Modifier } from 'draft-js';
import { getSelectedBlock } from 'draftjs-utils';

export default function addMention(
  editorState: EditorState,
  onChange: Function,
  separator: string,
  trigger: string,
  suggestion: Object,
  mouseSelect: string,
  mentionText: string
): void {
  const { label, value, url } = suggestion;

  const entityKey = editorState
    .getCurrentContent()
    .createEntity('MENTION', 'IMMUTABLE', { text: `${trigger}${value}`, value, url })
    .getLastCreatedEntityKey();
  const selectedBlock = getSelectedBlock(editorState);

  const selectedBlockText = selectedBlock.getText();
  let focusOffset = editorState.getSelection().focusOffset;
  const mentionIndex = (selectedBlockText.lastIndexOf(separator + trigger) || 0) + 1;
  let spaceAlreadyPresent = false;
  if (selectedBlockText.length === mentionIndex + 1) {
    focusOffset = selectedBlockText.length;
  }
  if (selectedBlockText[focusOffset] === ' ') {
    spaceAlreadyPresent = true;
  }
  if (mouseSelect) {
    focusOffset = mentionIndex + mentionText.length + 1;
  }
  let updatedSelection = editorState.getSelection().merge({
    anchorOffset: mentionIndex,
    focusOffset,
  });
  let newEditorState = EditorState.acceptSelection(editorState, updatedSelection);
  let contentState = Modifier.replaceText(
    newEditorState.getCurrentContent(),
    updatedSelection,
    `${label}`,
    null,
    entityKey
  );
  newEditorState = EditorState.push(newEditorState, contentState, 'insert-characters');

  if (!spaceAlreadyPresent) {
    // insert a blank space after mention
    updatedSelection = newEditorState.getSelection().merge({
      anchorOffset: mentionIndex + label.length,
      focusOffset: mentionIndex + label.length,
    });
    newEditorState = EditorState.acceptSelection(newEditorState, updatedSelection);
    contentState = Modifier.insertText(
      newEditorState.getCurrentContent(),
      updatedSelection,
      ' ',
      newEditorState.getCurrentInlineStyle(),
      undefined
    );
  }

  onChange(EditorState.push(newEditorState, contentState, 'insert-characters'));
}
