require 'coprl/presenters/dsl/components/event_base'

module Coprl
  module Presenters
    module Plugins
      module Stripe
        module Components
          class CreditCardForm < DSL::Components::EventBase

            attr_reader :stripe_publishable_key,
                        :address_config,
                        :required_fields,
                        :currency,
                        :form_type

            def initialize(stripe_publishable_key, **attribs, &block)
              @stripe_publishable_key = stripe_publishable_key
              @address_config = attribs.delete(:address_config){ {} }
              @required_fields = attribs.delete(:required_fields){ [] }
              @currency = attribs.delete(:currency){ 'usd' }
              @form_type = attribs[:form_type] || :multi_line

              super(type: :stripe_credit_card_form, **attribs, &block)

              expand!
            end

          end
        end
      end
    end
  end
end
