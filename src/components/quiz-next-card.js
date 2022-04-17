import { LitElement, html, css } from 'lit';

export const tagName = 'quiz-next-card';

class QuizNextCard extends LitElement {
  static properties = {
    show: {type: Boolean}
  };

  static styles = [css`
    .card {
      display: block;
      background: white;
      border-radius: 6px;
      padding: 20px;
      box-shadow: rgb(0 0 0 / 12%) 0px 0px 4px 0px, rgb(0 0 0 / 24%) 0px 4px 4px 0px;
      margin-bottom: 40px;
    }
  `];

  constructor() {
    super();
    this.show = false;
  }

  render() {
    return this.show ? 
      html`
        <div class="card">
          <p>🎉 Congratulations!</p>
          <p>You've answered all questions correctly. You can now move on to the next section.</p>
        </div>  
      ` : '';
  }
}

customElements.define(tagName, QuizNextCard);