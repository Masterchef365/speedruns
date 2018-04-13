// bester.Component subclasses render an Object of props into a bester.HTML
// instance, and add some class-name-based CSS classes to a prefix placeholder
// element facilitate styling and dedbugging.

import {HTML, TO_HTML} from '/assets/bester/html.js';


export class Component {
  constructor(props = null) {
    this.props = Object.freeze(Object.assign({}, props));

    const classNames = [];
    let currentClass = this.constructor;
    while (currentClass && currentClass.name && currentClass !== Object) {
      classNames.push(currentClass.name);
      currentClass = Object.getPrototypeOf(currentClass);
    }
    
    this.rendered = HTML`<before-bester-component class="${classNames.join(" ")}"></before-bester-component>${this.constructor.render(props)}`;

    Object.freeze(this);
  }

  [TO_HTML]() {
    return this.rendered;
  }

  static render(props) {
    throw new Error("not implemented"); 
  }
}

class JSONPre extends Component {
  static render(props) {
    return HTML`<pre>${JSON.stringify(props, null, 2)}</pre>`;
  }
}
