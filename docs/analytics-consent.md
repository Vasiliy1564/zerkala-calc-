# Analytics consent rollout

Analytics is deliberately disabled on both public sites. Do not enable it until
the website operator's identity, address and public contact have been confirmed,
and a site-specific privacy policy and separate analytics consent are published.

The loader fails closed. It requires `data-enabled="true"`, a valid counter ID,
`data-operator-name`, `data-operator-address`, `data-operator-contact`,
`data-policy-url` and `data-consent-url` before showing an opt-in prompt or
loading any Yandex code. Missing fields or disabled config never load analytics,
even if local storage contains an earlier acceptance.

Consent and refusal have equal visual weight. Choice is recorded locally with
timestamp and document version, for 180 days. A version change prompts again.
This local record is not an operator-side consent evidence register.
Revocation clears accessible `_ym_` browser storage and reloads the page to stop
the already-loaded runtime. It cannot erase earlier records held by Yandex.
No tracking pixel or noscript counter is installed.

When enabled, Webvisor and clickmap remain disabled. Fields and forms are
explicitly masked. URL query parameters and fragment are not passed in `url`.
Further privacy review of other site integrations and application forms is
separate from this analytics control; this change is not a legal-compliance audit.

Reference: https://yandex.ru/support/metrica/ru/general/notification
