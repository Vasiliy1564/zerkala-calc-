# Analytics consent rollout

The website operator has confirmed their identity, address and public contact.
The public privacy policy and separate analytics consent must be published and
verified before enabling this loader on a page. Never add an ungated Yandex
script or noscript tracking pixel alongside it.

The loader fails closed. It requires `data-enabled="true"`, a valid counter ID,
`data-operator-name`, `data-operator-address`, `data-operator-contact`,
`data-policy-url` and `data-consent-url` before showing an opt-in prompt or
loading any Yandex code. Missing fields or disabled config never load analytics,
even if local storage contains an earlier acceptance.

Consent and refusal have equal visual weight. Choice is recorded locally with
timestamp and document version, for 180 days. A version change prompts again.
The accepted timestamp and document version are also attached to Metrica visit
parameters, only after acceptance. This is not an independent immutable consent
evidence register.
Revocation clears accessible `_ym_` browser storage and reloads the page to stop
the already-loaded runtime. It cannot erase earlier records held by Yandex.
No tracking pixel or noscript counter is installed.

When enabled, Webvisor and clickmap remain disabled. Fields and forms are
explicitly masked. URL query parameters and fragment are not passed in `url`.
Further privacy review of other site integrations and application forms is
separate from this analytics control; this change is not a legal-compliance audit.

Reference: https://yandex.ru/support/metrica/ru/general/notification
