# Contextual chat and application guidance validation

This pass connects reviewed school cards to editable AI questions, preserves ordered program context for follow-ups, and adds sourced application guidance. Comparison controls reflect the actual three-school selection and offer direct navigation. New answers remain visible at their beginning.

The official LAUSD enrollment calendar was rechecked on October 21, 2026. It lists the 2027–28 Choices opening date as October 1, 2026, the closing date as November 6, 2026, and the late application opening date as December 1, 2026. It does not establish a cutoff hour, late application closing date, available seats, or a student's admission outcome. Source: [LAUSD enrollment calendar](https://www.lausd.org/apps/pages/index.jsp?uREC_ID=4432585&type=d&pREC_ID=2724498).

Application facts and bilingual project preparation guidance now have one shared input for the browser and generated server data. The source review deadline suppresses current-window date claims after expiry. Server status uses Los Angeles time; user/model dates do not determine it.

The chat API accepts bounded metadata context only. Known identifiers are resolved against current reviewed records, stale ordered references cannot select a school, and negative or ambiguous addition requests cannot change comparison. Clarification replies are server-authored questions, while factual answers still require retrieved official sources.

Local validation passed 159 automated checks: 115 unit checks, two HTTP/API checks, 16 browser flows, and 26 Python checks. Generated chat data freshness also passed for all 11 reviewed programs. Browser cases use mocked model responses to cover contextual drafts, comparison updates and navigation, displayed program order, revision changes, New chat, Spanish text, focus, and answer positioning without paid requests.

The Netlify preview `6ad949d45ff843180d399dc1` passed two real hosted provider requests. A 2027–28 application deadline question returned the canonical shared guidance, cited the official calendar and application portal, and did not request a grade or return unrelated schools. An explicit displayed order of Venice followed by Bravo made “Add the first one to comparison” return only Venice's canonical school identifier and official program citation. No quotas were reset or bypassed.

Manual preview browser inspection confirmed that a reviewed school card opens the editable question with the selected school's visible context and comparison count; no model request is made until Send. The full published provider/browser check is recorded separately in the release receipt after deployment.
