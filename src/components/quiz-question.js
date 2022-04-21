export const tagName = 'quiz-question';

const styles = `
<style>
  :host {
    display: block;
    background: white;
    border-radius: 6px;
    padding: 20px;
    box-shadow: rgb(0 0 0 / 12%) 0px 0px 4px 0px, rgb(0 0 0 / 24%) 0px 4px 4px 0px;
    margin-bottom: 40px;
  }

  h2 {
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

  .explanation {
    margin-top: 8px;
    font-weight: 300;
  }

  .emoji {
    margin-right: 8px;
  }
</style>
`

class QuizQuestion extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }

  connectedCallback() {
    this.render();

    this.addEventListener('change', (e) => {
      const buttons = this.querySelectorAll('input');
      const answer = parseInt(this.getAttribute('answer'));

      this.answered = e.target === buttons[answer];
      
      this.render();

      this.dispatchEvent(new CustomEvent('question-answered', {composed: true, bubbles: true}));
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      ${styles}
      <div class="card">
        <h2>${this.getAttribute('question')}</h2>
        <div class="options">
          <slot name="options"></slot>
        </div>
        ${this.answered 
          ? `
            <div><span class="emoji">✅</span> Correct!</div>
            <div class="explanation">${this.getAttribute('explanation')}</div>
          ` 
          : `<div><span class="emoji">❌</span> Incorrect</div>`}
      </div>  
    `;
  }
}

customElements.define(tagName, QuizQuestion);