(function() {
  // stripe.com/docs/js/elements_object/create_element#elements_create-options-classes
  const BASE_CLASS_NAME = 'v-stripe-element';
  const COMPLETE_CLASS_NAME = `${BASE_CLASS_NAME}--complete`;
  const EMPTY_CLASS_NAME = `${BASE_CLASS_NAME}--empty`;
  const FOCUSED_CLASS_NAME = `${BASE_CLASS_NAME}--focused`;
  const INVALID_CLASS_NAME = `${BASE_CLASS_NAME}--invalid`;
  const AUTOFILLED_CLASS_NAME = `${BASE_CLASS_NAME}--autofilled`;
  const ELEMENT_STYLE = {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  };

  // stripe.com/docs/js/elements_object/create_element#elements_create-options
  const ELEMENT_OPTIONS = {
    style: ELEMENT_STYLE,
    classes: {
      base: BASE_CLASS_NAME,
      complete: COMPLETE_CLASS_NAME,
      empty: EMPTY_CLASS_NAME,
      focus: FOCUSED_CLASS_NAME,
      invalid: INVALID_CLASS_NAME,
      webkitAutofill: AUTOFILLED_CLASS_NAME
    }
  }

  class StripeCreditCardForm {
    constructor(element) {
      console.debug('\tStripeCreditCardForm');
      this.element = element;
      this.data = this.element.dataset;
      this.stripe = Stripe(this.data.stripePublishableKey);
      this.formType = this.data.formType;
      this.elements = this.stripe.elements();

      if (this.formType === 'single_line') {
        const cardElement = document.querySelector('#card-element');
        this.cardNumber = this.elements.create('card', Object.assign({}, ELEMENT_OPTIONS, {hidePostalCode: true}));
        this.cardNumber.mount(cardElement);
        this.cardNumber.on('change', event => handleElementChange(event, cardElement));
      }
      else {
        const cardNumberElement = document.querySelector('#card-number');
        this.cardNumber = this.elements.create('cardNumber', Object.assign({}, ELEMENT_OPTIONS, {showIcon: true}));
        this.cardNumber.mount(cardNumberElement);
        this.cardNumber.on('change', event => handleElementChange(event, cardNumberElement));

        const cardExpiryElement = document.querySelector('#card-expiry');
        this.cardExpiry = this.elements.create('cardExpiry', ELEMENT_OPTIONS);
        this.cardExpiry.mount(cardExpiryElement);
        this.cardExpiry.on('change', event => handleElementChange(event, cardExpiryElement));

        const cardCvcElement = document.querySelector('#card-cvc');
        this.cardCvc = this.elements.create('cardCvc', ELEMENT_OPTIONS);
        this.cardCvc.mount(cardCvcElement);
        this.cardCvc.on('change', event => handleElementChange(event, cardCvcElement));
      }
    }

    stripeTokenData() {
      let data = {currency: this.data.currency, missing: []}
      if (this.data.addressConfig && this.formType !== 'single_line') {
        const config = JSON.parse(this.data.addressConfig);
        const requiredFields = JSON.parse(this.data.requiredFields);
        for (let field in config) {
          let value = config[field]
          if (Array.isArray(value)) {
            data[field] = value.map(elem_id =>
              document.getElementsByName(elem_id)[0] ? document.getElementsByName(elem_id)[0].value : ''
            ).join(' ');
          }
          else{
            data[field] = document.getElementsByName(value)[0] ? document.getElementsByName(value)[0].value : '';
          }
          if (requiredFields.includes(field) && !data[field]) {
            data['missing'].push(field);
          }
        }
      }
      return data;
    }
  }

  function tokenizeCreditCard(_options, params, _event, results) {
    return new Promise(function (resolve, reject) {
      let plugin = document.querySelector('.v-stripe_credit_card_form')
      const targetComponent = _event.currentTarget.vComponent
      if (plugin && plugin.vPlugin) {
        plugin = plugin.vPlugin
        targetComponent.disable();
        let tokenData = plugin.stripeTokenData();
        if (tokenData['missing'].length === 0) {  // Don't attempt to tokenize if any required field is missing
          delete tokenData['missing'];
          plugin.stripe.createToken(plugin.cardNumber, tokenData).then(function (response) {
            if (response.token) {
              const result = {
                action: 'tokenize_credit_card',
                content: {
                  onetime_token: response.token.id,
                  card: response.token.card,
                  client_ip: response.token.client_ip
                },
                statusCode: 200
              };
              result.content = JSON.stringify(result.content);
              results.push(result);
              resolve(results);
            } else {
              results.push(errorResult(response.error.message));
              targetComponent.enable();
              reject(results);
            }
          });
        } else {
          results.push(emptyResult());
          resolve(results);
        }
      } else {
        results.push(emptyResult());
        resolve(results);
      }
    });
  }

  function errorResult(message) {
    const bad_result = {
      action: 'tokenize_credit_card',
      contentType: 'application/json',
      content: {errors: message},
      statusCode: 400
    };
    bad_result.content = JSON.stringify(bad_result.content);
    return bad_result;
  }

  function emptyResult() {
    return {action: 'tokenize_credit_card', content: JSON.stringify({onetime_token: ''}), statusCode: 200}
  }

  function handleElementChange(event, element) {
    const mdcTextField = element.closest('.mdc-text-field');
    const inputHintElement = element.closest('.v-column').querySelector('.mdc-text-field-helper-text');
    const error = event.error;

    // Stripe's JS will dispatch the `change` event *before* it updates state classes.
    // Update element dataset state manually so listeners of the `stripeElementChange` (dispatched
    // below) have the actual current state of the element.
    if (event.complete) {
      element.setAttribute('data-complete', '');
    }
    else {
      element.removeAttribute('data-complete');
    }

    if (event.empty) {
      element.setAttribute('data-empty', '');
    }
    else {
      element.removeAttribute('data-empty');
    }

    if (event.invalid) {
      element.setAttribute('data-invalid', '');
    }
    else {
      element.removeAttribute('data-invalid');
    }

    if (error && error.message) {
      inputHintElement.textContent = error.message;
      inputHintElement.classList.remove('v-hidden');
      mdcTextField.classList.add('mdc-text-field--invalid');
    }
    else {
      inputHintElement.classList.add('v-hidden');
      inputHintElement.textContent = '';
      mdcTextField.classList.remove('mdc-text-field--invalid');
    }

    element.dispatchEvent(new CustomEvent('stripeElementChange', {
      detail: {stripeEvent: event},
      bubbles: true
    }));
  }

  window.StripeCreditCardForm = StripeCreditCardForm;
  window.tokenizeCreditCard = tokenizeCreditCard;
})();
