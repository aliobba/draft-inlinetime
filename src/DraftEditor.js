import React, { Component } from 'react';
//import ReactDOM from 'react-dom';
import { Editor, EditorState, RichUtils , CompositeDecorator  } from 'draft-js';
import InlineToolbar from './components/InlineToolbar/InlineToolbar';

import './components/DraftEditor/DraftEditor.css';

import {
  getSelectionRange,
  getSelectionCoords
} from './utils/index';

export default class DraftEditor extends Component {
  constructor() {
    super();

    const decorator = new CompositeDecorator([
      {
        strategy: findLinkEntities,
        component: Link,
      },
    ]);

    this.state = {
      inlineToolbar: { show: false },
      editorState: EditorState.createEmpty(decorator)
    };

    /* this.onChange = (editorState) => {
      console.log('editorState ==>', editorState.toJS());

      this.setState({ editorState });
    } */

    this.toggleInlineStyle = this.toggleInlineStyle.bind(this);
    this.handleKeyCommand = this.handleKeyCommand.bind(this);
    this.onChange = this.onChange.bind(this);
    this.setLink = this.setLink.bind(this);

    this.focus = () => this.refs.editor.focus();
  }
  
  onChange(editorState) {
    if (!editorState.getSelection().isCollapsed()) {
      const selectionRange = getSelectionRange();
      if (!selectionRange) {
        this.setState({ inlineToolbar: { show: false } });
        return;
      }
      const selectionCoords = getSelectionCoords(selectionRange);
      this.setState({
        inlineToolbar: {
          show: true,
          position: {
            top: selectionCoords.offsetTop,
            left: selectionCoords.offsetLeft
          }
        }
      });
    } else {
      this.setState({ inlineToolbar: { show: false } });
    }
    this.setState({ editorState });
  }

  toggleInlineStyle(inlineStyle) {
    this.onChange(
      RichUtils.toggleInlineStyle(
        this.state.editorState,
        inlineStyle
      )
    );
  }

  handleKeyCommand(command) {
    const { editorState } = this.state;
    const newState = RichUtils.handleKeyCommand(editorState, command);

    if (newState) {
      this.onChange(newState);
      return true;
    }

    return false;
  }

  setLink() {
    const urlValue = prompt('Paste URL', '');
    const { editorState } = this.state;
    const contentState = editorState.getCurrentContent();

    const contentStateWithEntity = contentState.createEntity(
      'LINK',
      'IMMUTABLE',
      { url: urlValue }
    );

    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.set(editorState, { currentContent: contentStateWithEntity });

    this.setState({
      editorState: RichUtils.toggleLink(
        newEditorState,
        newEditorState.getSelection(),
        entityKey
      )
    }, () => {
      setTimeout(() => this.focus(), 0);
    });
  }

  render() {
    const {
      inlineToolbar,
      editorState
    } = this.state;

    return (
      <div
        id="editor-container"
        className="c-editor-container js-editor-container"
      >
        {inlineToolbar.show
          ? <InlineToolbar
          editorState={editorState}
          onToggle={this.toggleInlineStyle}
          position={inlineToolbar.position}
          setLink={this.setLink}
        />
          : null
        }
        <div className="editor" onClick={this.focus}>
          <Editor
            editorState={editorState}
            onChange={this.onChange}
            handleKeyCommand={this.handleKeyCommand}
            customStyleMap={customStyleMap}
            ref="editor"
            placeholder="You can type here..."
          />
        </div>
      </div>
    );
  }
}

const customStyleMap = {
  HIGHLIGHT: {
    backgroundColor: 'palegreen',
  },
};

function findLinkEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges(
    (character) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === 'LINK'
      );
    },
    callback
  );
}

const Link = (props) => {
  const { url } = props.contentState.getEntity(props.entityKey).getData();

  return (
    <a href={url} title={url} className="ed-link">
      {props.children}
    </a>
  );
};