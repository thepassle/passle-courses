export const tagName = 'quiz-next-card';

const styles = `
<style>
  :host {
    display: none;
  }

  :host([show]) {
    display: block;
  }

  .card {
    display: block;
    background: white;
    border-radius: 6px;
    padding: 20px;
    box-shadow: rgb(0 0 0 / 12%) 0px 0px 4px 0px, rgb(0 0 0 / 24%) 0px 4px 4px 0px;
    margin-bottom: 40px;
  }

  .next-anchor:visited .next {
    color: black;
    text-decoration: none;
  }

  h1 {
    font-size: 26px;
    margin-top: 0;
    margin-bottom: 0;
  }

  .next-anchor {
    display: block;
    color: black;
    transition: transform 0.1s ease-in;
    border-radius: 6px;
    text-decoration: none;
  }

  a:focus {
    box-shadow: rgb(0, 82, 255) 0px 0px 12px, rgb(0, 82, 255) 0px 0px 0px 1px;
    outline: 1px;
    transition: box-shadow 0.1s ease-in-out 0s;
  }

  .next-anchor:hover,
  .next-anchor:focus {
    transform: scale(1.02);
    box-shadow: rgb(0, 82, 255) 0px 0px 12px, rgb(0, 82, 255) 0px 0px 0px 1px;
  }

  .next-header h1 {
    margin-bottom: 0;
  }

  .next-header svg {
    margin-right: 12px;
  }

  .next-anchor:hover .next-header,
  .next-anchor:focus .next-header {
    fill: rgb(0, 82, 225);
    color: rgb(0, 82, 255);
  }

  .next-header {
    align-items: center;
    display: flex;
  }


  .up-next {
    font-weight: 300;
    margin-bottom: 0;
  }

  .up-next-title {
    margin-top: 0;
  }

  .next {
    padding: 20px;

    box-shadow: rgb(0 0 0 / 12%) 0px 0px 4px 0px, rgb(0 0 0 / 24%) 0px 4px 4px 0px;
    background: white;
    border-radius: 6px;
  }
</style>
`;

class QuizNextCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      ${styles}
      <a class="next-anchor" href="${this.getAttribute('nextLink')}">
        <div class="next">
          <div class="next-header">
            <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 0 24 24" width="40px"><g><rect fill="none" height="24" width="24"/></g><g><path d="M22,12c0-5.52-4.48-10-10-10C6.48,2,2,6.48,2,12s4.48,10,10,10C17.52,22,22,17.52,22,12z M4,12c0-4.42,3.58-8,8-8 c4.42,0,8,3.58,8,8s-3.58,8-8,8C7.58,20,4,16.42,4,12z M16,12l-4,4l-1.41-1.41L12.17,13H8v-2h4.17l-1.59-1.59L12,8L16,12z"/></g></svg>
            <h1>Success!</h1>
          </div>
          <slot></slot>
          <p class="up-next">Up next:</p>
          <p class="up-next-title">${this.getAttribute('next')}</p>
        </div>
      </a>
    `;
  }
}

customElements.define(tagName, QuizNextCard);