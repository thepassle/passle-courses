import { LitElement, html, css } from 'lit';

export const tagName = 'quiz-question';

class QuizQuestion extends LitElement {
  static properties = {
    answered: {type: Boolean}
  };

  static styles = [css`
    :host {
      display: block;
      background: white;
      border-radius: 6px;
      padding: 20px;
      box-shadow: rgb(0 0 0 / 12%) 0px 0px 4px 0px, rgb(0 0 0 / 24%) 0px 4px 4px 0px;
      margin-bottom: 40px;
    }

    ::slotted(h2) {
      margin: 0;
    }

    .options {
      margin-top: 20px;
      margin-bottom: 20px;
      font-weight: 300;
    }

    ::slotted(.options-list) {
      display: block;
    }
  `];

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('change', (e) => {
      const buttons = this.querySelectorAll('input');

      const answer = parseInt(this.getAttribute('answer'));

      this.answered = e.target === buttons[answer];
      this.dispatchEvent(new CustomEvent('question-answered', {composed: true, bubbles: true}));
    });
  }

  render() {
    return html`
      <div class="card">
        <slot name="question"></slot>
        <div class="options">
          <slot name="options"></slot>
        </div>
        ${this.answered ? '✅ Correct!' : '❌ Incorrect'}
      </div>  
    `;
  }
}

customElements.define(tagName, QuizQuestion);