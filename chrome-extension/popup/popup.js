const $ = function(args) { return document.querySelector(args);}
const $$ = function(args) { return document.querySelectorAll(args);}

HTMLElement.prototype.on = function(a, b, c) { return this.addEventListener(a, b, c); }

$('input[name="guard"]').on('click', (evt) => {
  const disabled = !evt.target.checked;

  const others = $$('input:not([name="guard"])');
  others.forEach(input => input.disabled = disabled);
});

$('input[name="grayscale"]').on('click', (evt) => {
  const value = evt.target.checked;
  console.log(value);
});

$('input[name="blur"]').on('click', (evt) => {
  const value = evt.target.value;
  console.log(value);
});
