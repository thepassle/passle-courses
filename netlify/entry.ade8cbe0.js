const i="quiz-question",n=`
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
`;class o extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){this.render(),this.addEventListener("change",t=>{const e=this.querySelectorAll("input"),s=parseInt(this.getAttribute("answer"));this.answered=t.target===e[s],this.render(),this.dispatchEvent(new CustomEvent("question-answered",{composed:!0,bubbles:!0}))})}render(){this.shadowRoot.innerHTML=`
      ${n}
      <div class="card">
        <h2>${this.getAttribute("question")}</h2>
        <div class="options">
          <slot name="options"></slot>
        </div>
        ${this.answered?`
            <div><span class="emoji">\u2705</span> Correct!</div>
            <div class="explanation">${this.getAttribute("explanation")}</div>
          `:'<div><span class="emoji">\u274C</span> Incorrect</div>'}
      </div>  
    `}}customElements.define(i,o);export{i as tagName};
