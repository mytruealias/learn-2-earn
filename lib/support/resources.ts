/** U.S. national contact numbers. Live source/configured-region verification remains a release gate;
 * see docs/hubert-support/source-verification.json. Never infer regional coverage from city text. */
export const HUMAN_RESOURCES = [
  {
    id: "911",
    title: "Emergency help: 911 (U.S.)",
    href: "tel:911",
    description:
      "If you are in immediate danger or need urgent medical help. This app does not dispatch emergency services.",
    source: "https://www.911.gov/calling-911/",
  },
  {
    id: "988",
    title: "Crisis support: 988 (U.S.)",
    href: "tel:988",
    textHref: "sms:988",
    description:
      "Call or text for suicide or mental-health crisis support. You can contact a person without using Hubert.",
    source: "https://988lifeline.org/",
  },
  {
    id: "211",
    title: "Local services: 211 (U.S.)",
    href: "tel:211",
    description:
      "Ask about local food, housing and community services. Local availability and options vary.",
    source: "https://www.211.org/get-help",
  },
] as const;
