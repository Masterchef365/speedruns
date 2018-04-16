// bester.Component subclasses render an Object of props into a bester.HTML
// instance, and add some class-name-based CSS classes to a prefix placeholder
// element facilitate styling and dedbugging.

import {HTML} from '/assets/bester/html.js';
import {LazySymbolScope} from '/assets/bester/utils.js';


const internal = new LazySymbolScope('internal ');


export class Component {
  constructor(props = null) {
    const classNames = [];
    let currentClass = this.constructor;
    while (currentClass && currentClass.name && currentClass !== Component) {
      classNames.push(currentClass.name);
      currentClass = Object.getPrototypeOf(currentClass);
    }
    this[internal.classNames] = classNames;

    this[internal.props] = null;
    this[internal.element] = null;
    this[internal.rendered] = null;

    Object.seal(this);

    this[internal.setProps](props);
  }

  get props() {
    return this[internal.props];
  }

  static render(props) {
    throw new Error("not implemented"); 
  }

  [HTML.fromThis]() {
    return HTML`<bester-component class="${this[internal.classNames].join(" ")}">${this[internal.rendered]}</bester-component>`;
  }

  [internal.getElement]() {
    if (!this[internal.element]) {
      this[internal.element] = document.createElement('bester-component');
      this[internal.element].classList.add(...this[internal.classNames]);
      this[internal.element].appendChild(this[internal.rendered].fragment());
    }
    return this[internal.element];
  }

  [internal.setProps](props) {
    this[internal.props] = Object.freeze(Object.assign({}, this.props, props));

    this[internal.rendered] = this.constructor.render(props);

    if (this[internal.element]) {
      this[internal.element].textContent = '';
      this[internal.element].appendChild(this[internal.rendered].fragment())
    }
  }
}


// FOR NOW, only a root component allows its props to be changed, so everything must be re-rendered at once.
export class RootComponent extends Component {
  get element() {
    return this[internal.getElement]();
  }

  set props(props) {
    this[internal.setProps](props);
  }
}
