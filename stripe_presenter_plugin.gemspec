lib = File.expand_path("../lib", __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'stripe_presenter_plugin/version'

Gem::Specification.new do |spec|
  spec.name          = 'stripe_presenter_plugin'
  spec.version       = StripePresenterPlugin::VERSION
  spec.authors       = ["Evvnt, Inc."]
  spec.email         = ["dev@evvnt.com"]

  spec.summary       = %q{A COPRL presenter plugin for Stripe}
  spec.homepage      = 'https://github.com/evvnt/stripe_presenters_plugin'
  spec.license       = 'MIT'

  spec.files         = `git ls-files -z`.split("\x0").reject do |f|
    f.match(%r{^(test|spec|features)/})
  end
  spec.require_paths = ['lib']

  spec.add_development_dependency 'bundler', "~> 2.0"
  spec.add_development_dependency "rake", ">= 12.3.3"
end
